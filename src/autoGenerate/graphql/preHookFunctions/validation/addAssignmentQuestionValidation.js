import { get } from 'lodash';
import { AssignmentWithSimilarStatementAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getAssignmentQuestion = async (courseIds, statement, isHomework, assignmentFilter) => {
  const query = `{
  assignmentQuestions(
    filter: {
      and: [
        ${courseIds ? `{ courses_some:{ id_in:[${courseIds}] } }` : ''}
        ${statement ? `{ statement: "${statement}" }` : ''}
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
  const { coursesConnectIds = [], input: { statement, isHomework = false } } = params;
  if (statement) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    // check if the assignmentQuestion with similar statement exist
    const assignmentQuestionsData = await getAssignmentQuestion(courseIds, statement, isHomework);
    if (assignmentQuestionsData && assignmentQuestionsData.length > 0) {
      throw new AssignmentWithSimilarStatementAlreadyExist();
    }
  }
  return true;
};

export default addAssignmentQuestionValidation;
