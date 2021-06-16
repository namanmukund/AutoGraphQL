import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchTopics = async () => {
  const query = `
          {
            topics{
              id
              order
            }
          }
          `;
  const topics = await callLocalGraphqlApi(query);
  return get(topics, 'data.topics', []);
};

const updateCourseInTopic = async (topicId) => {
  const mutation = `
      mutation{
        updateTopic(id: "${topicId}", coursesConnectIds: "cjs8skrd200041huzz78kncz5"){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateTopic', {});
};

const updateCourseInTopics = async () => {
  // eslint-disable-next-line no-await-in-loop
  const topics = await fetchTopics();
  // eslint-disable-next-line no-restricted-syntax
  for (const topic of topics) {
    const topicId = topic.id;
    if (topicId) {
      // eslint-disable-next-line no-await-in-loop
      await updateCourseInTopic(topicId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated topic id : ${topicId}, with order : ${topic.order}`);
    }
  }
};
export default updateCourseInTopics;
