import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  componentTypes, PUBLISHED,
} from '../../../../constants';

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
    const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
              questions(filter:{assessmentType:${componentTypes.quiz}}){
                id
                order
              }
            }
          }
          `;
    const topicQueryRes = await callGraphqlApi(topicQuery);
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
    let restQuerv = '';
    if (topicOrder) {
      const nextTopicOrder = topicOrder + 1;
      const nextTopicQuery = `
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
      const nextTopicQueryRes = await callGraphqlApi(nextTopicQuery);
      const nextTopicInfo = get(nextTopicQueryRes, 'data.topics[0]');
      const nextTopicId = get(nextTopicInfo, 'id');
      if (nextTopicId) {
        restQuerv = `nextComponent:{
                     topicConnectId:"${nextTopicId}"
                     nextComponentType: ${componentTypes.video}
                   }`;
      }
      // In case of last topic quiz, next component in not populated
    }

    const addUserQuizMutation = `
              mutation{
                  addUserQuiz(
                  userConnectId:"${userId}"
                  topicConnectId:"${topicId}"
                  input:{
                      ${restQuerv}
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
    const result = await callGraphqlApi(addUserQuizMutation);
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
