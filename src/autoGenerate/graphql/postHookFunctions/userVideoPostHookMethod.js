import { get } from 'lodash';
import callGraphqlApi from '../../../api/callGraphqlApi';
import {
  PUBLISHED,
  userTopicTypeStatus,
} from '../../../../constants';
import getInfoFromParams from './utils/getInfoFromParams';
import getNextComponent from './utils/getNextComponent';

// query to get topic and it's Lo with order 1
const topicQuery = topicId => `
  query{
    topic(id:"${topicId}"){
      id
      order
      learningObjectives(filter:{
        status: ${PUBLISHED}
        }
        orderBy: order_ASC
        first: 1
      ){
        id
      }
    }
  }
  `;

// query to add UserVideo if it is not already present for user and topic id
const addUserVideoMutation = (
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
      nextComponent{
        learningObjective{
          id
        }
        nextComponentType
      }
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
  /*
  checking if document is already present in collection for user and topic id,
  returning input in that case
  if it is not already present, we will add a new document with default data
  */
  if (input && input.length) {
    return input;
  }
  const resultArray = [];
  const {
    userId,
    topicId,
  } = getInfoFromParams(params, 'video');
  /*
    we are getting below fields in topicQuery:
    -first published learning objective of the query to be populated in next component
    */
  const topicQueryRes = await callGraphqlApi(topicQuery(topicId));
  const topicInfo = get(topicQueryRes, 'data.topic');
  const learningObjectiveConnectId = get(topicInfo, 'learningObjectives[0].id');
  // next component will be chat of first published LO
  const restQuery = getNextComponent(
    learningObjectiveConnectId,
    '',
    'video',
  );
  /*
    adding addUserVideo document on the basis of
    restQuery(next component data), rest data will take default values from schema
    */
  const result = await callGraphqlApi(addUserVideoMutation(
    userId,
    topicId,
    restQuery,
  ));
  if (result) {
    /*
      parsing data 'addUserVideo' so that the logic implemented ahead can read data is
      desired format and return the same.
      Example: suppose client has asked for title and order of topic,
      In that case he will get title and order only. And this is happening when we parse
      data as below. If parsing is not done, it is returning empty data.
      */
    const parsedData = get(result, 'data.addUserVideo');
    if (parsedData) {
      const topic = { type: 'Topic', typeId: `${parsedData.topic.id}` };
      const user = { type: 'User', typeId: `${parsedData.user.id}` };
      // constructing data for next component whenever userVideo document is just created
      if (parsedData.nextComponent && parsedData.nextComponent.learningObjective) {
        const nextComponent = { learningObjective: {
          type: 'LearningObjective', typeId: `${parsedData.nextComponent.learningObjective.id}`,
        },
        nextComponentType: `${parsedData.nextComponent.nextComponentType}`,
        };
        parsedData.nextComponent = nextComponent;
      }
      parsedData.topic = topic;
      parsedData.user = user;
      resultArray.push(parsedData);
    }
  }
  return resultArray;
};

export default userVideoPostHookMethod;
