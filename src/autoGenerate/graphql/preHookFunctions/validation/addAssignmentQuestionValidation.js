import { get } from 'lodash';
import { AssignmentWithSimilarStatementAlreadyExist, OrderAlreadyExistsError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getAssignmentQuestion = async (courseIds, statement, isHomework, order, assignmentFilter) => {
  const query = `{
  assignmentQuestions(
    filter: {
      and: [
        ${courseIds ? `{ courses_some:{ id_in:[${courseIds}] } }` : ''}
        ${statement ? `{ statement: "${statement}" }` : ''}
        ${order ? `{ order: ${order} }` : ''}
        { isHomework: ${isHomework} }
        ${assignmentFilter || ''}
      ]
    }
  ) {
    id
  }
}`;
  const assignmentQuestionsData = await callLocalGraphqlApi(query);
  return get(assignmentQuestionsData, 'data.assignmentQuestions');
};

const addAssignmentQuestionValidation = async (params) => {
  const { coursesConnectIds = [], input = {} } = params;
  const statement = get(input, 'statement');
  const order = get(input, 'order');
  const isHomework = get(input, 'isHomework');
  if (statement || order) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    // check if the assignmentQuestion with similar statement exist
    if (statement) {
      const assignmentQuestionsData = await getAssignmentQuestion(courseIds, statement, isHomework);
      if (assignmentQuestionsData && assignmentQuestionsData.length > 0) {
        throw new AssignmentWithSimilarStatementAlreadyExist();
      }
    }
    if (order) {
      const assignmentQuestionsData = await getAssignmentQuestion(courseIds, null, isHomework, order);
      if (assignmentQuestionsData && assignmentQuestionsData.length > 0) {
        throw new OrderAlreadyExistsError();
      }
    }
  }
  return true;
};

export default addAssignmentQuestionValidation;
