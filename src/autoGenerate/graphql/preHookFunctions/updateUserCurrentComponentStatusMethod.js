import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  InvalidTopicPassedInCurrentComponent,
} from '../../../../constants/errors';

const updateUserCurrentComponentStatusMethod = async (params) => {
  const userCurrentComponentStatusId = get(params, 'id');
  const topicId = get(params, 'currentTopicConnectId');
  if (userCurrentComponentStatusId && topicId) {
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

    const userCurrentComponentStatusQuery = `
          query{
            userCurrentComponentStatus(id:"${userCurrentComponentStatusId}"){
              id
              currentTopic{
                id
                title
                order
              }
            }
          }
        `;
    const userCurrentComponentStatusData = await callGraphqlApi(
      userCurrentComponentStatusQuery);
    const userCurrentComponentTopicOrder = get(
      userCurrentComponentStatusData,
      'data.userCurrentComponentStatus.currentTopic.order');
    // checking if topic passed order is greater than current topic's
    if (userCurrentComponentTopicOrder &&
      topicOrder &&
      topicOrder <= userCurrentComponentTopicOrder) {
      throw new InvalidTopicPassedInCurrentComponent();
    }
  }
};

export default updateUserCurrentComponentStatusMethod;
