import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes, PUBLISHED,
} from '../../../../constants';
import { log } from '../../../../utils';

// query to get quiz questions associated with topic
const topicQuery = topicId => `
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

// query to get topic with passed order. This will be used for next component
const nextTopicQuery = topicId => `
  query{
  topics(
    filter:{
      status: ${PUBLISHED}
    }
    after:"${topicId}", 
    orderBy:order_ASC, 
    first:1
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
) => `
  mutation{
    addUserQuiz(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
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
const userQuizPostHookMethod = async (userQuizResult, params) => {
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(loSome, 'topic_some.id');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of userQuizPostHookMethod');
  }
  /*
  checking if document is not already present in collection for user and topic id
  if it is not already present, we will add a new document with default data
  */
  if (userQuizResult && userQuizResult.length === 0) {
    /*
    we are getting below fields in topicQuery:
    -all published quiz questions of the topic
    */
    const topicQueryRes = await callGraphqlApi(topicQuery(topicId));
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
    let restQuery = '';
    /*
    we are getting next published topic id through this query.
    If it is not present, next component will be empty
    */
    const nextTopicQueryRes = await callGraphqlApi(nextTopicQuery(topicId));
    const nextTopicId = get(nextTopicQueryRes, 'data.topics[0].id');
    if (nextTopicId) {
      restQuery = `nextComponent:{
                     topicConnectId:"${nextTopicId}"
                     nextComponentType: ${topicTypes.video}
                   }`;
    }
    const result = await callGraphqlApi(addUserQuizMutation(
      userId,
      topicId,
      restQuery,
      quizQuery,
    ));
    if (result) {
      /*
      parsing data 'addUserQuiz' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
      const parsedData = get(result, 'data.addUserQuiz');
      if (parsedData) {
        const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
        const user = { type: 'User', typeId: `${parsedData.user.id}` };
        const quiz = [];
        // constructing data for quiz whenever userQuiz document is just created
        const quizRes = parsedData.quiz;
        if (quizRes) {
          quizRes.forEach((quizQuestion) => {
            const question = { question: { type: 'QuestionBank',
              typeId: `${quizQuestion.question.id}` },
            questionDisplayOrder: `${quizQuestion.questionDisplayOrder}` };
            quiz.push(question);
          });
        }
        // constructing data for next component whenever userVideo document is just created
        if (parsedData.nextComponent && parsedData.nextComponent.topic) {
          const nextComponent = { topic: {
            type: 'Topic', typeId: `${parsedData.nextComponent.topic.id}`,
          },
          nextComponentType: `${parsedData.nextComponent.nextComponentType}`,
          };
          parsedData.nextComponent = nextComponent;
        }

        parsedData.topic = topic;
        parsedData.user = user;
        parsedData.quiz = quiz;
        resultArray.push(parsedData);
      }
    }
  }
  return resultArray;
};

export default userQuizPostHookMethod;
