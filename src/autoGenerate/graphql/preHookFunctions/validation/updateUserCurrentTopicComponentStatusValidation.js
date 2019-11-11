import { get } from 'lodash';
import {
  InvalidTopicPassedInCurrentTopicComponent,
  TopicOrUserCurrentTopicComponentNotPresentError,
} from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

// query to get topic order info
const topicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
    }
  }
  `;

// query to get user current topic component status
const userCurrentTopicComponentStatusQuery = (userCurrentTopicComponentStatusId) => `
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

// pre hook contains logic to check if passed topic's order is not less than already present in
// user current topic component status
const updateUserCurrentTopicComponentStatusValidation = async (params) => {
  const { id: userCurrentTopicComponentStatusId } = params;
  const { currentTopicConnectId: topicId } = params;
  if (!userCurrentTopicComponentStatusId) {
    throw new TopicOrUserCurrentTopicComponentNotPresentError();
  }
  /*
  fetching order of the topic called
  This condtion is placed to check if user is trying to update componentType and not topic
  In that case this validation will not get fired
  */
  if (topicId) {
    const topicData = await callLocalGraphqlApi(topicQuery(topicId));
    const topicOrder = get(topicData, 'data.topic.order');
    // Fetching userCurrentTopicComponentStatus to get order of current topic
    const userCurrentTopicComponentStatusData = await callLocalGraphqlApi(
      userCurrentTopicComponentStatusQuery(userCurrentTopicComponentStatusId),
    );
    const userCurrentTopicComponentTopicOrder = get(
      userCurrentTopicComponentStatusData,
      'data.userCurrentTopicComponentStatus.currentTopic.order',
    );
    // checking if topic passed order is greater than current topic's
    if (userCurrentTopicComponentTopicOrder
      && topicOrder
      && topicOrder <= userCurrentTopicComponentTopicOrder) {
      throw new InvalidTopicPassedInCurrentTopicComponent();
    }
  }
  return true;
};

export default updateUserCurrentTopicComponentStatusValidation;
