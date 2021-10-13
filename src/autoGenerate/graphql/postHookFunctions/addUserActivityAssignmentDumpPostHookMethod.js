import { get } from 'lodash';
import {
  OLD_COURSE_ID,
  PUBLISHED,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  AssignmentQuestionsNotPresentError,
} from '../../../../constants/errors';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';

// query to fetch user assignment info
const userAssignmentQuery = (
  userId,
  topicId,
  courseId,
) => `
   query{
      userAssignments(filter:{
        and:[
          {user_some:{
          id:"${userId}"
          }},
          {topic_some:{
            id:"${topicId}"
          }},
          ${courseId ? `{course_some:{id:"${courseId}"}},` : ''}
        ]
      }){
        id
        assignment{
          assignmentQuestion{
            id
          }
          assignmentQuestionDisplayOrder
          userAnswerCodeSnippet
          isAttempted
        }
        assignmentStatus
        topic {
          id
          order
          topicComponentRule{
            componentName
            order
            childComponentName
            learningObjective{
              id
              order
              messagesMeta{
                count
              }
              questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
                count
              }
              comicStripsMeta(filter:{status:${PUBLISHED}}){
                count
              }
            }
            blockBasedProject{
              id
              order
            }
            video{
              id
            }
          }
        }
      }
    }
    `;

// mutation to update UserQuiz, pushing updated quiz questions
const updateUserAssignmentMutation = (userAssignmentId, input) => `
  mutation{
    updateUserAssignment(id:"${userAssignmentId}",  input:{
      ${input}
    }){
      id
    }
  }
  `;

const escapeString = (value) => value.replace(/\\([\s\S])|(")/g, '\\$1$2');

// method to update UserAssignment submitted by user
const updateUserAssignment = async (
  assignmentQuestionsInUserAssignment,
  assignmentQuestions,
  userAssignmentId,
  assignmentAction,
  assignmentStatusInUserAssignment,
) => {
  const { next } = userActionType;
  const { complete, incomplete } = userTopicTypeStatus;
  let assignmentStatus = incomplete;
  /*
  pushMany query to store user's answer in User assignment
  */
  let pushManyQuery = 'assignment:{ pushMany: [';
  /*
  Iterating over each quiz question from input and will update question in
  userQuizReport on basis of input(isCorrect, isAttempted etc.)
  */
  assignmentQuestionsInUserAssignment.forEach((assignmentQuestionElem) => {
    const assignmentQuestionId = get(assignmentQuestionElem, 'assignmentQuestion.id');
    const assignmentQuestionDisplayOrder = get(assignmentQuestionElem, 'assignmentQuestionDisplayOrder');
    let isAttempted = get(assignmentQuestionElem, 'isAttempted', false);
    let userAnswerCodeSnippet = get(assignmentQuestionElem, 'userAnswerCodeSnippet', '');
    /*
    Iterate on each one of assignmentQuestions in user Assignment and get answer provided by
    user/mentee for respective assignment question
    */
    assignmentQuestions.forEach((assignmentQuestion) => {
      const currentAssignmentQuestionId = get(assignmentQuestion, 'assignmentQuestion.typeId');
      /*
      iterating over questions from input and assignmentQuestions and
      comparing for same question and updating userAnswerCodeSnippet
      */
      if (currentAssignmentQuestionId === assignmentQuestionId) {
        const { isAttempted: isQuestionAttempted } = assignmentQuestion;
        if (isQuestionAttempted) {
          isAttempted = true;
          userAnswerCodeSnippet = escapeString(get(assignmentQuestion, 'userAnswerCodeSnippet'));
        }
      }
    });
    pushManyQuery += `{ assignmentQuestionConnectId: "${assignmentQuestionId}", `;
    pushManyQuery += `assignmentQuestionDisplayOrder: ${assignmentQuestionDisplayOrder}, `;
    if (isAttempted) {
      pushManyQuery += `isAttempted: ${isAttempted}, `;
    } else {
      pushManyQuery += 'isAttempted: false, ';
    }
    pushManyQuery += `userAnswerCodeSnippet: "${userAnswerCodeSnippet}", `;
    pushManyQuery += '}, ';
  });
  // both for loop end here
  pushManyQuery += ']},';

  // next will only be sent by mentor after he checks the assignment and it's complete
  // we are changing assignmentStatus to complete accordingly. Client should not send next
  // from  a mentee account.
  if (assignmentStatusInUserAssignment === complete || assignmentAction === next) {
    assignmentStatus = complete;
  }
  pushManyQuery += `assignmentStatus: ${assignmentStatus}`;

  const popAllQuery = 'assignment:{  popAll: true }';

  // pop all the elements in the assignment array in userAssignment
  await callLocalGraphqlApi(updateUserAssignmentMutation(userAssignmentId, popAllQuery));
  // push all the existing elements with updated data in the assignment array in userAssignment
  await callLocalGraphqlApi(updateUserAssignmentMutation(userAssignmentId, pushManyQuery));

  return true;
};

/*
UserActivityAssignmentDump and and UserAssignment is updated according to -
  -current topic component status
  -UserAssignment for provided userId and topic id
  -topic.
*/
const addUserActivityAssignmentDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  const courseId = get(input, 'course.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityQuizDumpPostHookMethod');
  }

  /*
  we are getting userAssignment for below purpose:
  -we get userAssignment id , which will be used further to update the document
  */
  const userAssignmentQueryRes = await callLocalGraphqlApi(userAssignmentQuery(userId, topicId, courseId));
  const userAssignmentInfo = get(userAssignmentQueryRes, 'data.userAssignments[0]');
  const assignmentQuestionsInUserAssignment = get(userAssignmentInfo, 'assignment');
  const assignmentStatusInUserAssignment = get(userAssignmentInfo, 'assignmentStatus');
  const { id: userAssignmentId } = userAssignmentInfo;

  const { assignmentAction, assignmentQuestions, isHomework } = input;

  if (!courseId || courseId === OLD_COURSE_ID) {
    // throwing error if client has not send any assignment question in input
    if (!assignmentQuestions || !assignmentQuestions.length) {
      log('AssignmentQuestions are not present in input in addUserActivityAssignmentDumpPostHookMethod');
      throw new AssignmentQuestionsNotPresentError();
    }
  }
  // throwing error if there are no published assignment questions in database
  if (!assignmentQuestionsInUserAssignment
    || !assignmentQuestionsInUserAssignment.length) {
    log('Assignment Questions are not present in UserQuiz in addUserActivityAssignmentDumpPostHookMethod');
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.AssignmentQuestions: is not present',
      },
    });
  }
  // Updating UserAssignment according to the input sent
  if (!userAssignmentId) {
    log('Not able to fetch userAssignmentId in addUserActivityQuizDumpPostHookMethod');
  }
  await updateUserAssignment(
    assignmentQuestionsInUserAssignment,
    assignmentQuestions,
    userAssignmentId,
    assignmentAction,
    assignmentStatusInUserAssignment,
  );

  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);

  if (courseId && (courseId !== OLD_COURSE_ID)) {
    const topicComponentRule = get(userAssignmentInfo, 'topic.topicComponentRule', []);
    const topicOrder = get(userAssignmentInfo, 'topic.order');
    const page = isHomework ? 'homeworkAssignment' : 'assignment';
    await updateCurrentComponentStatusOfNewCourse(
      courseId,
      currentTopicComponentInfo,
      assignmentAction,
      topicId,
      '',
      '',
      '',
      page,
      topicComponentRule,
      topicOrder,
    );
  }
  return true;
};

export default addUserActivityAssignmentDumpPostHookMethod;
