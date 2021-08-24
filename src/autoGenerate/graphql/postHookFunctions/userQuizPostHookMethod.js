import { get } from 'lodash';
import {
  topicTypes, PUBLISHED, OLD_COURSE_ID,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import getNextComponent from './utils/getNextComponent';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

// query to get quiz questions associated with topic
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      questions(filter:{
        and:[
          {
            assessmentType:${topicTypes.quiz}
          },
          {
            status: ${PUBLISHED}
          }
        ]
      }){
        id
        order
      }
    }
  }
  `;

// query to get published topic list
const nextTopicQuery = () => `
query{
  topics(
    filter:{
      and:[
        {
          status: published
        },
        {
          courses_some:{
            id: "${OLD_COURSE_ID}"
          }
        }
      ]
    }
    orderBy:order_ASC,
  ){
    id
  }
}
  `;

// query to add UserQuiz if it is not already present for user and topic id
const addUserQuizMutation = (
  userId,
  topicId,
  restQuery,
  quizQuery,
  courseId
) => `
  mutation{
    addUserQuiz(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    input:{
        ${restQuery}
        ${quizQuery}
    }
    ){
      id
      user{
        id
      }
      topic{
        id
      }
      quizStatus
      quiz{
        question{
          id
        }
        questionDisplayOrder
      }
      nextComponent{
        topic{
          id
        }
        nextComponentType
      }
    }
    }
    `;

/*
If userQuiz document does not exist for provided combination of user id and topic id.
It will be created and returned to tekie app with all the questions.
Document contains all the necessary information needed on page along
with the next component.
*/
const userQuizPostHookMethod = async (input, params) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
  let restQuery = '';
  const resultArray = [];
  const {
    userId,
    topicId,
    courseId,
  } = getInfoFromParams(params, 'quiz');
  // In case there is no topic id, empty data will be sent
  if (!topicId) {
    return resultArray;
  }
  /*
    we are getting below fields in topicQuery:
    -all published quiz questions of the topic
    */
  const topicQueryRes = await callLocalGraphqlApi(topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  // adding quiz questions in the document
  // this logic will be changed based on question sets
  let quizQuery = 'quiz:[';
  if (topicInfo) {
    const quizQuestionsinTopic = get(topicInfo, 'questions');
    quizQuestionsinTopic.forEach((quizQuestion) => {
      const {
        id: quizQuestionId,
        order: quizQuestionOrder,
      } = quizQuestion;
      quizQuery += `{ questionConnectId: "${quizQuestionId}"
                            questionDisplayOrder: ${quizQuestionOrder}
                          }, `;
    });
  }
  quizQuery += ']';
  /*
    We are getting published topics list through this query.
    Then we will get next published topic
    */
  const nextTopicQueryRes = await callLocalGraphqlApi(nextTopicQuery());
  const topicsList = get(nextTopicQueryRes, 'data.topics');

  let currentTopicIndex;
  topicsList.forEach((topic, index) => {
    if (topic.id === topicId) {
      currentTopicIndex = index;
    }
  });
  let nextTopicId = '';
  if (currentTopicIndex + 1 < topicsList.length) {
    nextTopicId = topicsList[currentTopicIndex + 1].id;
  }

  if (!courseId || (courseId === OLD_COURSE_ID)) {
    restQuery = getNextComponent(
      '',
      nextTopicId,
      'quiz',
    );
  }
  
  const result = await callLocalGraphqlApi(addUserQuizMutation(
    userId,
    topicId,
    restQuery,
    quizQuery,
    courseId
  ));
  if (result) {
    /*
      parsing data 'addUserQuiz' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const addUserQuizResult = get(result, 'data.addUserQuiz');
    if (addUserQuizResult) {
      resultArray.push(parseTopicComponentResultData(addUserQuizResult, 'quiz'));
    }
  }
  return resultArray;
};

export default userQuizPostHookMethod;
