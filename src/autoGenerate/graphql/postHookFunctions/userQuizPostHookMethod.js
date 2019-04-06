import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes, PUBLISHED,
} from '../../../../constants';

// query to get quiz questions associated with topic
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      questions(filter:{assessmentType:${topicTypes.quiz}}){
        id
        order
      }
    }
  }
  `;

// query to get topic with passed order. This will be used for next component
const nextTopicQuery = async nextTopicOrder => `
  query{
    topics(filter:{
      and:[
        {order:${nextTopicOrder}},
        {status: ${PUBLISHED}}
      ]
    }){
      id
    }
  }
  `;

// query to add UserQuiz if it is not already present for user and topic id
const addUserQuizMutation = async (
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
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const loSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(loSome, 'topic_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (userId && topicId && input && input.length === 0) {
    const topicQueryRes = await callGraphqlApi(await topicQuery(topicId));
    const topicInfo = get(topicQueryRes, 'data.topic');
    const topicOrder = get(topicInfo, 'order');
    // adding quiz questions in the document
    // this logic will be changed based on set
    let quizQuery = 'quiz:[';
    if (topicInfo) {
      const quizQuestionsinTopic = get(topicInfo, 'questions');
      quizQuestionsinTopic.forEach((quizQuestion) => {
        quizQuery += `{ questionConnectId: "${quizQuestion.id}"
                            questionDisplayOrder: ${quizQuestion.order}
                          }, `;
      });
    }
    quizQuery += ']';
    let restQuery = '';
    if (topicOrder) {
      const nextTopicOrder = topicOrder + 1;
      const nextTopicQueryRes = await callGraphqlApi(await nextTopicQuery(nextTopicOrder));
      const nextTopicInfo = get(nextTopicQueryRes, 'data.topics[0]');
      const nextTopicId = get(nextTopicInfo, 'id');
      if (nextTopicId) {
        restQuery = `nextComponent:{
                     topicConnectId:"${nextTopicId}"
                     nextComponentType: ${topicTypes.video}
                   }`;
      }
      // In case of last topic quiz, next component in not populated
    }
    const result = await callGraphqlApi(await addUserQuizMutation(
      userId,
      topicId,
      restQuery,
      quizQuery,
    ));
    if (result) {
      // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      // desired format and return the same
      const parsedData = get(result, 'data.addUserQuiz');
      if (parsedData) {
        const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
        const user = { type: 'User', typeId: `${parsedData.user.id}` };
        const quiz = [];
        const quizRes = parsedData.quiz;
        if (quizRes) {
          quizRes.forEach((quizQuestion) => {
            const question = { question: { type: 'QuestionBank',
              typeId: `${quizQuestion.question.id}` },
            questionDisplayOrder: `${quizQuestion.questionDisplayOrder}` };
            quiz.push(question);
          });
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
