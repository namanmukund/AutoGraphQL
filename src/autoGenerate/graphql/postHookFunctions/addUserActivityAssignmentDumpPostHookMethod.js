import { get } from 'lodash';
import {
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import {
  DatabaseRecordNotFoundError,
  AssignmentQuestionsNotPresentError,
} from '../../../../constants/errors';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';

// query to fetch user assignment info
const userAssignmentQuery = (
  userId,
  topicId,
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
        ]
      }){
        id
        assignment{
          assignmentQuestion{
            id
          }
          assignmentQuestionDisplayOrder
        }
        assignmentStatus
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

// const escapeString = (value) => value.replace(/\\([\s\S])|(")/g, '\\$1$2');

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
    let isAttempted = false;
    let userAnswerCodeSnippet = '';
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
          userAnswerCodeSnippet = get(assignmentQuestion, 'userAnswerCodeSnippet');
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
const addUserActivityAssignmentDumpPostHookMethod = async (input) => {
  const userId = get(input, 'user.typeId');
  const topicId = get(input, 'topic.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityQuizDumpPostHookMethod');
  }

  /*
  we are getting userAssignment for below purpose:
  -we get userAssignment id , which will be used further to update the document
  */
  const userAssignmentQueryRes = await callLocalGraphqlApi(userAssignmentQuery(userId, topicId));
  const userAssignmentInfo = get(userAssignmentQueryRes, 'data.userAssignments[0]');
  const assignmentQuestionsInUserAssignment = get(userAssignmentInfo, 'assignment');
  const assignmentStatusInUserAssignment = get(userAssignmentInfo, 'assignmentStatus');
  const { id: userAssignmentId } = userAssignmentInfo;

  const { assignmentAction, assignmentQuestions } = input;

  // throwing error if client has not send any assignment question in input
  if (!assignmentQuestions || !assignmentQuestions.length) {
    log('AssignmentQuestions are not present in input in addUserActivityAssignmentDumpPostHookMethod');
    throw new AssignmentQuestionsNotPresentError();
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
  return true;
};

export default addUserActivityAssignmentDumpPostHookMethod;
