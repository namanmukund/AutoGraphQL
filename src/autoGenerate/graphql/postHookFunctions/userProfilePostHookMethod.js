import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';

const userProfilePostHookMethod = async (input, params) => {
  const resultArray = [];
  const userId = get(params, 'filter.user_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (userId && input && input.length === 0) {
    const addUserProfileMutation = `
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
    const result = await callGraphqlApi(addUserProfileMutation);
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
