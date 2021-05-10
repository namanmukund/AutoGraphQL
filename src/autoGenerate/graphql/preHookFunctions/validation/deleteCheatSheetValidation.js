import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { CheatSheetIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteCheatSheetValidation = async (params) => {
  const { id: cheatSheetId } = params;
  const query = `
        {
            cheatSheet(id:"${cheatSheetId}") {
                status
            }
        }
    `;
  const cheatSheet = await callLocalGraphqlApi(query);
  if (get(cheatSheet, 'data.cheatSheet.status', UNPUBLISHED) === PUBLISHED) {
    throw new CheatSheetIsPublishedError();
  }
  return true;
};

export default deleteCheatSheetValidation;
