import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { WorkbookIsPublished } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteWorkbookValidation = async (params) => {
  const { id: workbookId } = params;
  const query = `
        {
            workbook(id:"${workbookId}") {
                status
            }
        }
    `;
  const workbook = await callLocalGraphqlApi(query);
  if (get(workbook, 'data.workbook.status', UNPUBLISHED) === PUBLISHED) {
    throw new WorkbookIsPublished();
  }
  return true;
};

export default deleteWorkbookValidation;
