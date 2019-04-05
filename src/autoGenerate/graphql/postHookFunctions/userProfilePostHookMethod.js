import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';

// query to add UserProfile with default values
const addUserProfileMutation = async userId => `
  mutation{
    addUserProfile(
      userConnectId:"${userId}"
      input:{
        topicsCompleted: 0
      }){
      id
      charactersUnlocked
      proficientTopics{
        id
      }
      proficientTopicCount
      freeProficientTopicCount
      masteredTopics{
        id
      }
      masteredTopicCount
      freeMasteredTopicCount
      familiarTopics{
        id
      }
      familiarTopicCount
      freeFamiliarTopicCount
    }
  }
  `;

// We have logic to create a new document if it does not exist for UserProfile
const userProfilePostHookMethod = async (input, params) => {
  const resultArray = [];
  const userId = get(params, 'filter.user_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (userId && input && input.length === 0) {
    const result = await callGraphqlApi(await addUserProfileMutation(userId));
    if (result) {
      const data = get(result, 'data.addUserProfile');
      if (data) {
        resultArray.push(data);
      }
    }
  }
  return resultArray;
};

export default userProfilePostHookMethod;
