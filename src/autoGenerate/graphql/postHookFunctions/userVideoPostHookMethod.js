import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  topicTypes,
  userTopicTypeStatus,
} from '../../../../constants';

// query to get topic and it's Lo with order 1
const topicQuery = async topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      learningObjectives(filter:{
        order: 1
      }){
        id
      }
    }
  }
  `;

// query to add UserVideo if it is not already present for user and topic id
const addUserVideoMutation = async (
  userId,
  topicId,
  restQuery,
) => `
  mutation{
    addUserVideo(
    userConnectId:"${userId}"
    topicConnectId:"${topicId}"
    input:{
        status: ${userTopicTypeStatus.incomplete}
        ${restQuery}
    }
    ){
      id
      user{
        id
      }
      topic{
        id
      }
      videoCurrentTime
      isBookmarked
      isLiked
      status
    }
    }
    `;

/*
If userVideo document does not exist for provided combination of user id and topic id.
It will be created and returned to tekie app.
Document contains all the necessary information needed on page along
with the next component.
*/
const userVideoPostHookMethod = async (input, params) => {
  const resultArray = [];
  const filterArray = get(params, 'filter.and');
  const userSome = filterArray.find(obj => obj.user_some);
  const topicSome = filterArray.find(obj => obj.topic_some);
  const userId = get(userSome, 'user_some.id');
  const topicId = get(topicSome, 'topic_some.id');
  // value of input in case of query is result of the query
  // so we are adding new document if document is not already present
  if (userId && topicId && input && input.length === 0) {
    const topicQueryRes = await callGraphqlApi(await topicQuery(topicId));
    const topicInfo = get(topicQueryRes, 'data.topic');
    const learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');
    let restQuery = '';
    if (learningObjectiveConnectId) {
      restQuery = `nextComponent:{
                     learningObjectiveConnectId:"${learningObjectiveConnectId}"
                     nextComponentType: ${topicTypes.message}
                   }`;
    }
    const result = await callGraphqlApi(await addUserVideoMutation(
      userId,
      topicId,
      restQuery,
    ));
    if (result) {
      // parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      // desired format and return the same
      const parsedData = get(result, 'data.addUserVideo');
      if (parsedData) {
        const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
        const user = { type: 'User', typeId: `${parsedData.user.id}` };
        parsedData.topic = topic;
        parsedData.user = user;
        resultArray.push(parsedData);
      }
    }
  }
  return resultArray;
};

export default userVideoPostHookMethod;
