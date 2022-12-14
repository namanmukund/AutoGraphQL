import { get } from 'lodash';
import { operationName, topicComponents } from '../../../../../constants';

const { add, update } = operationName;

const userAssignmentReportDump = async (input, mutationOrQueryName, assignmentsData) => {
  const assignmentQuestions = [];
  let eventType = add;
  if (mutationOrQueryName === 'updateUserAssignment') {
    eventType = update;
  }
  get(input, 'assignment', []).forEach((question) => {
    const assignmentQuestion = assignmentsData.find((assignmentData) => get(assignmentData, 'assignmentQuestion.typeId') === get(question, 'id'));
    if (assignmentQuestion) {
      assignmentQuestions.push({
        codingAssignmentId: get(question, 'assignmentQuestion.typeId'),
        attempted: !!get(question, 'userAnswerCodeSnippet'),
        isHomework: get(assignmentQuestion, 'isHomework', false),
        code: get(question, 'userAnswerCodeSnippet') && get(question, 'userAnswerCodeSnippet') !== 'null' ? get(question, 'userAnswerCodeSnippet') : '',
      });
    }
  });
  const reportsInputObj = {
    topicId: get(input, 'topic.typeId'),
    userId: get(input, 'user.typeId'),
    componentId: get(input, 'id'),
    componentType: topicComponents.assignment,
    eventType,
    recordRawDump: assignmentQuestions,
  };
  return reportsInputObj;
};

export default userAssignmentReportDump;
