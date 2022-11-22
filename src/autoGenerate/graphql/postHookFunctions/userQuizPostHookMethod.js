import { get } from 'lodash';
import {
  PUBLISHED,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { fetchAndCacheQueryRes } from '../resolvers/mutation/userData/menteeCourseSyllabus';
import { topicAssignmentAndQuizQuery } from './userAssignmentPostHookMethod';

// query to add UserQuiz if it is not already present for user and topic id
const addUserQuizMutation = (
  userId,
  topicId,
  quizQuery,
  courseId,
) => `
  mutation{
    addUserQuiz(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    input:{
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
const userQuizPostHookMethod = async (input, params, mutationName, context) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
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
  const topicQueryRes = await fetchAndCacheQueryRes({
    hkey: `static::topic::userQuizOrAssignment::${topicId}`,
    maxAge: 604800,
    dbCallback: () => callLocalGraphqlApi(topicAssignmentAndQuizQuery(topicId), context),
  });
  const topicInfo = get(topicQueryRes, 'data.topic');
  // adding quiz questions in the document
  // this logic will be changed based on question sets
  let quizQuery = 'quiz:[';
  if (topicInfo) {
    const quizQuestionsinTopic = get(topicInfo, 'topicQuestions', [])
      .filter((topicQ) => ((get(topicQ, 'question.status') === PUBLISHED) && get(topicQ, 'question.assessmentType') === 'quiz'))
      .map((topicQ) => ({
        ...get(topicQ, 'question', {}),
        order: get(topicQ, 'order'),
      }));
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

  const result = await callLocalGraphqlApi(addUserQuizMutation(
    userId,
    topicId,
    quizQuery,
    courseId,
  ), context);
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
