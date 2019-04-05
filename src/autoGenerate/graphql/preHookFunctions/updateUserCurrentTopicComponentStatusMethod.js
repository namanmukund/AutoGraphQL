import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  InvalidTopicPassedInCurrentTopicComponent,
} from '../../../../constants/errors';

const updateUserCurrentTopicComponentStatusMethod = async (params) => {
  const userCurrentTopicComponentStatusId = get(params, 'id');
  const topicId = get(params, 'currentTopicConnectId');
  if (userCurrentTopicComponentStatusId && topicId) {
    const topicQuery = `
          query{
            topic(id:"${topicId}"){
              id
              order
            }
          }
          `;
    const topicData = await callGraphqlApi(topicQuery);
    const topicOrder = get(topicData, 'data.topic.order');

    const userCurrentTopicComponentStatusQuery = `
          query{
            userCurrentTopicComponentStatus(id:"${userCurrentTopicComponentStatusId}"){
              id
              currentTopic{
                id
                title
                order
              }
            }
          }
        `;
    const userCurrentTopicComponentStatusData = await callGraphqlApi(
      userCurrentTopicComponentStatusQuery);
    const userCurrentTopicComponentTopicOrder = get(
      userCurrentTopicComponentStatusData,
      'data.userCurrentTopicComponentStatus.currentTopic.order');
    // checking if topic passed order is greater than current topic's
    if (userCurrentTopicComponentTopicOrder &&
      topicOrder &&
      topicOrder <= userCurrentTopicComponentTopicOrder) {
      throw new InvalidTopicPassedInCurrentTopicComponent();
    }
  }
};

export default updateUserCurrentTopicComponentStatusMethod;
