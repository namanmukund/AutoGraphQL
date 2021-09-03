import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { BlockBasedProjectIsPublished } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteBlockBasedProjectValidation = async (params) => {
  const { id: blockBasedProjectId } = params;
  const query = `
        {
            blockBasedProject(id:"${blockBasedProjectId}") {
                status
            }
        }
    `;
  const blockBasedProject = await callLocalGraphqlApi(query);
  if (get(blockBasedProject, 'data.blockBasedProject.status', UNPUBLISHED) === PUBLISHED) {
    throw new BlockBasedProjectIsPublished();
  }
  return true;
};

export default deleteBlockBasedProjectValidation;
