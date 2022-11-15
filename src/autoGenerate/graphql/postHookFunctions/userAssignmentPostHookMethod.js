import { get } from 'lodash';
import {
  PUBLISHED,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { log } from '../../../../utils';
import { MENTEE } from '../../../../constants/roles';
import { fetchAndCacheQueryRes } from '../resolvers/mutation/userData/menteeCourseSyllabus';

// query to get assignment questions associated with topic
export const topicAssignmentAndQuizQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      topicQuestions {
        question {
          id
          order
          assessmentType
          status
        }
        order
      }
      topicHomeworkAssignmentQuestion {
        assignmentQuestion {
          id
          difficulty
          isHomework
          status
        }
        order
      }
      topicAssignmentQuestions {
        assignmentQuestion {
          id
          difficulty
          isHomework
          status
        }
        order
      }
    }
  }
  `;

// query to add UserAssignment if it is not already present for user and topic id
const addUserAssignmentMutation = (
  userId,
  topicId,
  assignmentQuery,
  courseId,
) => `
  mutation{
    addUserAssignment(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    ${courseId ? `courseConnectId:"${courseId}"` : ''}
    input:{
        ${assignmentQuery}
    }
    ){
      id
      user{
        id
      }
      topic{
        id
      }
      assignmentStatus
      assignment{
        assignmentQuestion{
          id
        }
        assignmentQuestionDisplayOrder
      }
    }
    }
    `;

/*
If userAssignment document does not exist for provided combination of user id and topic id.
It will be created and returned to tekie app with all the assignment questions.
Document contains all the necessary information needed on page
*/
const userAssignmentPostHookMethod = async (input, params, mutationName, context) => {
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
  if (get(context, 'userRoleFromContext') && get(context, 'userRoleFromContext') !== MENTEE) {
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
  let assignmentStatus = null;
  const filterArray = get(params, 'filter.and');
  if (filterArray) {
    assignmentStatus = filterArray.find((filterElem) => filterElem.assignmentStatus);
  }
  // if there is assignmentStatus field in the query, we will not add a new document and will return existing result
  if (assignmentStatus) {
    return resultArray;
  }

  /*
    we are getting below fields in topicQuery:
    -all published assignment questions of the topic
    */
  const topicQueryRes = await fetchAndCacheQueryRes({
    hkey: `static::topic::userQuizOrAssignment::${topicId}`,
    maxAge: 604800,
    dbCallback: () => callLocalGraphqlApi(topicAssignmentAndQuizQuery(topicId), context),
  });
  const topicInfo = get(topicQueryRes, 'data.topic');
  // adding assignment questions in the document
  // this logic will be changed based on assignment question sets
  let assignmentQuery = 'assignment:[';
  if (topicInfo) {
    let assignmentQuestionsinTopic = [];
    assignmentQuestionsinTopic = get(topicInfo, 'topicAssignmentQuestions', [])
      .filter((topicAQ) => get(topicAQ, 'assignmentQuestion.status') === PUBLISHED)
      .map((topicAQ) => ({
        ...get(topicAQ, 'assignmentQuestion', {}),
        order: get(topicAQ, 'order'),
      }));
    assignmentQuestionsinTopic = [
      ...assignmentQuestionsinTopic,
      ...get(topicInfo, 'topicHomeworkAssignmentQuestion', [])
        .filter((topicAQ) => get(topicAQ, 'assignmentQuestion.status') === PUBLISHED)
        .map((topicAQ) => ({
          ...get(topicAQ, 'assignmentQuestion', {}),
          order: get(topicAQ, 'order'),
        })),
    ];
    let sortedAssignmentQuestionsinTopic = [];

    if (!assignmentQuestionsinTopic || (assignmentQuestionsinTopic && !assignmentQuestionsinTopic.length)) {
      log('assignmentQuestionsinTopic info missing in topicInfo');
    }
    if (assignmentQuestionsinTopic && assignmentQuestionsinTopic.length > 0) {
      sortedAssignmentQuestionsinTopic = assignmentQuestionsinTopic.sort((a, b) => a.order - b.order);
    }

    let finalAssignmentQuestionsForQuery = [];
    finalAssignmentQuestionsForQuery = sortedAssignmentQuestionsinTopic || [];

    // eslint-disable-next-line no-restricted-syntax
    for (const assignmentQuestion of finalAssignmentQuestionsForQuery) {
      const {
        id: assignmentQuestionId,
        order: assignmentQuestionOrder,
      } = assignmentQuestion;
      assignmentQuery += `{ assignmentQuestionConnectId: "${assignmentQuestionId}"
                            assignmentQuestionDisplayOrder: ${assignmentQuestionOrder}
                          }, `;
    }
  } else {
    log('topicInfo is missing');
  }
  assignmentQuery += ']';

  const result = await callLocalGraphqlApi(addUserAssignmentMutation(
    userId,
    topicId,
    assignmentQuery,
    courseId,
  ), context);

  if (result) {
    /*
      parsing data 'addUserAssignment' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const addUserAssignmentResult = get(result, 'data.addUserAssignment');
    if (addUserAssignmentResult) {
      resultArray.push(parseTopicComponentResultData(addUserAssignmentResult, 'assignment'));
    }
  }
  reportDump(input, mutationName, context);
  return resultArray;
};

export default userAssignmentPostHookMethod;
