import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { ProjectIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteProjectValidation = async (params) => {
  const { id: projectId } = params;
  const query = `
        {
            project(id:"${projectId}") {
                status
            }
        }
    `;
  const project = await callLocalGraphqlApi(query);
  if (get(project, 'data.project.status', UNPUBLISHED) === PUBLISHED) {
    throw new ProjectIsPublishedError();
  }
  return true;
};

export default deleteProjectValidation;
