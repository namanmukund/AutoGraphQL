import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import {
  InvalidTopicPassedInCurrentTopicComponent,
} from '../../../../../constants/errors';

// query to get topic order info
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
    }
  }
  `;

// query to get user current topic component status
const userCurrentTopicComponentStatusQuery = async userCurrentTopicComponentStatusId => `
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

// pre hook logic to check if passed topic's order is not less than already present in
// user current topic component status
const updateUserCurrentTopicComponentStatusValidation = async (params) => {
  const userCurrentTopicComponentStatusId = get(params, 'id');
  const topicId = get(params, 'currentTopicConnectId');
  if (userCurrentTopicComponentStatusId && topicId) {
    const topicData = await callGraphqlApi(await topicQuery(topicId));
    const topicOrder = get(topicData, 'data.topic.order');
    const userCurrentTopicComponentStatusData = await callGraphqlApi(
      await userCurrentTopicComponentStatusQuery(userCurrentTopicComponentStatusId));
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

export default updateUserCurrentTopicComponentStatusValidation;
