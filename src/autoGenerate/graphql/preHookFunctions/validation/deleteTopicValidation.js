import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import checkDeleteStatusOfATopic from './utils/checkDeleteStatusOfATopic';
import { PUBLISHED } from '../../../../../constants';

const deleteTopicValidation = async (params) => {
  const { id: topicId } = params;
  const query = `
        {
          topic(id: "${topicId}") {
            id
            status
            videoStatus
            learningObjectives {
              id
              status
              messageStatus
              questionBankMeta(filter: {status: ${PUBLISHED}}) {
                count
              }
            }
          }
        }
`;

  const res = await callGraphqlApi(query);
  const topic = get(res, 'data.topic');
  if (topic) {
    checkDeleteStatusOfATopic(topic);
  }
  return true;
};


export default deleteTopicValidation;
