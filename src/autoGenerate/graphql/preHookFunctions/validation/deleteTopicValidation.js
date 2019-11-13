import { get } from 'lodash';
import checkDeleteStatusOfATopic from './utils/checkDeleteStatusOfATopic';
import { PUBLISHED } from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

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

  const res = await callLocalGraphqlApi(query);
  const topic = get(res, 'data.topic');
  if (topic) {
    checkDeleteStatusOfATopic(topic);
  }
  return true;
};


export default deleteTopicValidation;
