import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../../constants';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController } from '../../../controllers';

const getAllTopics = async () => {
  const query = `
    query{
      topics {
        id
        contentStatus
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.topics', []);
};

const updateTopicContentStatus = async () => {
  const newAuthentication = {
    bypass: true,
  };
  const topics = await getAllTopics();
  if (topics && topics.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const topic of topics) {
      const contentStatus = get(topic, 'contentStatus');
      if (contentStatus === UNPUBLISHED) {
        const topicId = get(topic, 'id');
        const controller = new MutationController('Topic', newAuthentication);
        // eslint-disable-next-line no-await-in-loop
        await controller.updateOne({ id: topicId }, { contentStatus: PUBLISHED });
      }
    }
  }
};

export default updateTopicContentStatus;
