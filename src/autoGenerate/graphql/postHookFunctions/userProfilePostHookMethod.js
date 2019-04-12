import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import { log } from '../../../../utils';

// query to add UserProfile with default values
const addUserProfileMutation = userId => `
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
const userProfilePostHookMethod = async (userProfileResult, params) => {
  const resultArray = [];
  const userId = get(params, 'filter.user_some.id');
  if (!userId) {
    log('userId is missing in input of userProfilePostHookMethod');
  }
  // userProfileResult is the document returned by the query
  // so we are adding new document if document is not already present
  if (userProfileResult && userProfileResult.length === 0) {
    const result = await callGraphqlApi(addUserProfileMutation(userId));
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
