import { get } from 'lodash';
import {
  PUBLISHED,
  skillsLevel,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import parseTopicComponentResultData from './utils/parseTopicComponentResultData';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { log } from '../../../../utils';

// query to get assignment questions associated with topic
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      assignmentQuestions(
        filter:{
          status: ${PUBLISHED}
        }
      ){
        id
        order
        difficulty
        isHomework
      }
    }
  }
  `;

// query to add UserAssignment if it is not already present for user and topic id
const addUserAssignmentMutation = (
  userId,
  topicId,
  assignmentQuery,
  courseId
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
  const {
    easy,
    medium,
    hard,
  } = skillsLevel;

  let userSkillLevel = easy;
  const resultArray = [];
  const {
    userId,
    topicId,
    courseId
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
  Getting data for user current topic component status from context based on mutationName
  This will be used to get the assignment questions based on skill level of the user
  */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  const {
    skillsLevel: userSkillsLevelFromDb,
  } = currentTopicComponentInfo;

  if (skillsLevel) {
    userSkillLevel = userSkillsLevelFromDb;
  }
  /*
    we are getting below fields in topicQuery:
    -all published assignment questions of the topic
    */
  const topicQueryRes = await callLocalGraphqlApi(topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  // adding assignment questions in the document
  // this logic will be changed based on assignment question sets
  let assignmentQuery = 'assignment:[';
  if (topicInfo) {
    const assignmentQuestionsinTopic = get(topicInfo, 'assignmentQuestions');
    let sortedAssignmentQuestionsinTopic = [];
    const easyAssignmentQuestions = [];
    const mediumAssignmentQuestions = [];
    const difficultAssignmentQuestions = [];

    if (!assignmentQuestionsinTopic || (assignmentQuestionsinTopic && !assignmentQuestionsinTopic.length)) {
      log('assignmentQuestionsinTopic info missing in topicInfo');
    }
    if (assignmentQuestionsinTopic && assignmentQuestionsinTopic.length > 0) {
      sortedAssignmentQuestionsinTopic = assignmentQuestionsinTopic.sort((a, b) => a.order - b.order);
    }

    // dividing questions in the three buckets easy, medium and hard
    // Easy(0, 1) medium(2, 3) difficult(4, 5)
    sortedAssignmentQuestionsinTopic.forEach((sortedAssignmentQuestion) => {
      if (!sortedAssignmentQuestion.difficulty || sortedAssignmentQuestion.difficulty < 2) {
        easyAssignmentQuestions.push(sortedAssignmentQuestion);
      } else if (sortedAssignmentQuestion.difficulty > 1 && sortedAssignmentQuestion.difficulty < 4) {
        mediumAssignmentQuestions.push(sortedAssignmentQuestion);
      } else {
        difficultAssignmentQuestions.push(sortedAssignmentQuestion);
      }
    });

    const finalAssignmentQuestionsForQuery = [];
    // assignment question will populate on basis of user skill type and available questions
    // LOgic is as below.
    // Student' appetite:
    // Easy(1) medium(2, 3) difficult(4, 5)
    // Easy-4(E1, E2,   E3, E4)
    // Medium-2 (E1, M1) (E3, M2)
    // Difficult -2  (M1 D1) (M2, D2)
    let assignmentQuestionCount = 0;
    let homeworkQuestionCount = 0;
    switch (userSkillLevel) {
      case easy:
        // push 2 questions each for homewok and assignment from medium
        if (easyAssignmentQuestions.length > 0) {
          easyAssignmentQuestions.forEach((easyAssignmentQuestion) => {
            if (easyAssignmentQuestion && easyAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (easyAssignmentQuestion && !easyAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // if 2 easy questions are not there for each homework and assignment, got to medium
        if ((homeworkQuestionCount < 2 || assignmentQuestionCount < 2) && mediumAssignmentQuestions.length > 0) {
          mediumAssignmentQuestions.forEach((mediumAssignmentQuestion) => {
            if (mediumAssignmentQuestion && mediumAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (mediumAssignmentQuestion && !mediumAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // if 2 questions are not still there go to difficult
        if ((homeworkQuestionCount < 2 || assignmentQuestionCount < 2) && difficultAssignmentQuestions.length > 0) {
          difficultAssignmentQuestions.forEach((difficultAssignmentQuestion) => {
            if (difficultAssignmentQuestion && difficultAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (difficultAssignmentQuestion && !difficultAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }
        break;
      case medium:
        // push 1 question each for homewok and assignment from medium
        if (mediumAssignmentQuestions.length > 0) {
          mediumAssignmentQuestions.forEach((mediumAssignmentQuestion) => {
            if (mediumAssignmentQuestion && mediumAssignmentQuestion.isHomework && homeworkQuestionCount < 1) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (mediumAssignmentQuestion && !mediumAssignmentQuestion.isHomework && assignmentQuestionCount < 1) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // push 1 question each for homewok and assignment from easy
        // if there were no medium questions, this will get populated
        if (easyAssignmentQuestions.length > 0) {
          easyAssignmentQuestions.forEach((easyAssignmentQuestion) => {
            if (easyAssignmentQuestion && easyAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (easyAssignmentQuestion && !easyAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // if 2 questions are not still there go to difficult
        if ((homeworkQuestionCount < 2 || assignmentQuestionCount < 2) && difficultAssignmentQuestions.length > 0) {
          difficultAssignmentQuestions.forEach((difficultAssignmentQuestion) => {
            if (difficultAssignmentQuestion && difficultAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (difficultAssignmentQuestion && !difficultAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        break;
      case hard:
        // push 1 question each for homewok and assignment from difficult
        if (difficultAssignmentQuestions.length > 0) {
          difficultAssignmentQuestions.forEach((difficultAssignmentQuestion) => {
            if (difficultAssignmentQuestion && difficultAssignmentQuestion.isHomework && homeworkQuestionCount < 1) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (difficultAssignmentQuestion && !difficultAssignmentQuestion.isHomework && assignmentQuestionCount < 1) {
              finalAssignmentQuestionsForQuery.push(difficultAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // push remaining 1 question each for homewok and assignment from medium
        // // if there were no difficult questions, this will get populated
        if (mediumAssignmentQuestions.length > 0) {
          mediumAssignmentQuestions.forEach((mediumAssignmentQuestion) => {
            if (mediumAssignmentQuestion && mediumAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (mediumAssignmentQuestion && !mediumAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(mediumAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }

        // if 2 questions are not still there go to easy
        if ((homeworkQuestionCount < 2 || assignmentQuestionCount < 2) && easyAssignmentQuestions.length > 0) {
          easyAssignmentQuestions.forEach((easyAssignmentQuestion) => {
            if (easyAssignmentQuestion && easyAssignmentQuestion.isHomework && homeworkQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              homeworkQuestionCount += 1;
            }

            if (easyAssignmentQuestion && !easyAssignmentQuestion.isHomework && assignmentQuestionCount < 2) {
              finalAssignmentQuestionsForQuery.push(easyAssignmentQuestion);
              assignmentQuestionCount += 1;
            }
          });
        }
        break;
      default:
    }

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

  log('assignmentQuery: ', assignmentQuery);
  const result = await callLocalGraphqlApi(addUserAssignmentMutation(
    userId,
    topicId,
    assignmentQuery,
    courseId
  ));

  log('addUserAssignmentMutation result: ', result);
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
  return resultArray;
};

export default userAssignmentPostHookMethod;
