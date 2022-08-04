import { get } from 'lodash';
import { ApprovedCodeTagIsAddedToCodeError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteUserApprovedCodeTagValidation = async (params, _mutationOrQueryName, context) => {
  const { id: approvedCodeTagId } = params;
  const query = `
        {
            userApprovedCodeTag(id:"${approvedCodeTagId}") {
                codeCount
            }
        }
    `;
  const approvedCodeTag = await callLocalGraphqlApi(query, context);
  const isAddedToCode = (get(approvedCodeTag, 'data.userApprovedCodeTag.codeCount', 0) > 0);
  if (isAddedToCode) {
    throw new ApprovedCodeTagIsAddedToCodeError();
  }
  return true;
};

export default deleteUserApprovedCodeTagValidation;
