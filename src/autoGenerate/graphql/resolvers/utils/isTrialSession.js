import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const isTrialSession = async (topicId) => {
  const topicQuery = `
        query{
          topic(id:"${topicId}"){
            id
            order
          }
        }
`;
  const topicData = await callLocalGraphqlApi(topicQuery);
  const topicOrder = get(topicData, 'data.topic.order');
  return topicOrder === 1;
};

export default isTrialSession;
