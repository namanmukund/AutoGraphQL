import { get } from 'lodash';
import { AssignmentWithSimilarStatementAlreadyExist, OrderAlreadyExistsError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { getAssignmentQuestion } from './addAssignmentQuestionValidation';

const fetchCoursesFromAssignmentQuestion = async (assignmentQuestionId) => {
  const query = `{
  assignmentQuestion(id:"${assignmentQuestionId}"){
    id
    courses{
      id
    }
  }
}`;
  const assignmentQuestionData = await callLocalGraphqlApi(query);
  return get(assignmentQuestionData, 'data.assignmentQuestion', {});
};

const updateAssignmentQuestionValidation = async (params) => {
  const { input = {}, id: assignmentQuestionId } = params;
  const statement = get(input, 'statement');
  const order = get(input, 'order');
  const isHomework = get(input, 'isHomework', false);
  if (statement || order) {
    let courseIds = '';
    const assignmentQuestionData = await fetchCoursesFromAssignmentQuestion(assignmentQuestionId);
    if (assignmentQuestionData) {
      get(assignmentQuestionData, 'courses', []).forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    }
    // check if the assignmentQuestion with similar statement exist
    const assignmentFilter = `{ id_not:"${assignmentQuestionId}" }`;
    if (statement) {
      const assignmentQuestionsData = await getAssignmentQuestion(courseIds, statement, isHomework, null, assignmentFilter);
      if (assignmentQuestionsData && assignmentQuestionsData.length > 0) {
        throw new AssignmentWithSimilarStatementAlreadyExist();
      }
    }
    if (order) {
      const assignmentQuestionsData = await getAssignmentQuestion(courseIds, null, isHomework, order, assignmentFilter);
      if (assignmentQuestionsData && assignmentQuestionsData.length > 0) {
        throw new OrderAlreadyExistsError();
      }
    }
  }
  return true;
};

export default updateAssignmentQuestionValidation;
