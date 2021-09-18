import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { AssignmentQuestionIdPublished } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteAssignmentQuestionValidation = async (params) => {
  const { id: assignmentQuestionId } = params;
  const query = `
        {
            assignmentQuestion(id:"${assignmentQuestionId}") {
                status
            }
        }
    `;
  const assignmentQuestion = await callLocalGraphqlApi(query);
  if (get(assignmentQuestion, 'data.assignmentQuestion.status', UNPUBLISHED) === PUBLISHED) {
    throw new AssignmentQuestionIdPublished();
  }
  return true;
};

export default deleteAssignmentQuestionValidation;
