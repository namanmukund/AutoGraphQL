import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  userActionType,
} from '../../../../../../constants';
import {
  ComponentLockedError,
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import updateCurrentComponentStatus
  from '../../../postHookFunctions/utils/updateCurrentComponentStatus';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {currentCourse_some:{
        and:[
          {status: ${PUBLISHED}},
          {title: ${GLOBAL_COURSE_TITLE}}
        ]
      }}
      ]
    }){
      id
      currentTopic{
        id
        order
      }
      currentLearningObjective{
        id
        order
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

// query to get topic and it's first published learning objective
const getTopicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      learningObjectives(filter:{
        status: ${PUBLISHED}
        }
        orderBy: order_ASC
      ){
        id
      }
    }
  }
  `;

// mutation to update User Video
const addUserVideoDump = (userConnectId,
  topicConnectId,
  videoAction) => `
  mutation{
    addUserActivityVideoDump(
      userConnectId: "${userConnectId}"
    topicConnectId:"${topicConnectId}"
    input:{
      videoAction: ${videoAction}
    }
  ){
      id
    }
  }
  `;


/*
This is called when user tries to skip video on journey page
It will just update the userCurrentTopicComponentStatus to message
if called called topic video is current component
If sent topic is not unlocked, it will return component locked error
If skipped video is already unlocked, it will not update anything and will
return just user and topic's first Learning Objective
*/
const skipVideoMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const { next } = userActionType;
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  const { topicId } = params;
  if (!topicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
  }

  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  // calling API to get data of fetched topic
  const topicRes = await callLocalGraphqlApi(
    getTopicQuery(topicId),
    context,
    '',
  );
  // getting info of called topic
  const topicInfo = get(topicRes, 'data.topic');
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic is not present',
      },
    });
  }
  const firstLearningObjectiveId = get(topicInfo, 'learningObjectives[0].id');
  // returning error if there is no published LO for topic
  if (!firstLearningObjectiveId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic.firstLearningObjectiveId: is not present',
      },
    });
  }

  // getting current  omponent status for user
  const res = await callLocalGraphqlApi(
    getUserCurrentTopicComponentStatus(userId),
    context,
    '',
  );

  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');

  // calling method to validate user current topic component status
  validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  const {
    currentTopic,
  } = currentTopicComponentInfo;

  // if user tries to skip video which is not yet covered, we will throw below error
  if (topicInfo.order > currentTopic.order) {
    throw new ComponentLockedError();
  }

  /*
  Calling method to update current user Topic Component status
  */
  await updateCurrentComponentStatus(
    currentTopicComponentInfo,
    next,
    topicId,
    '',
    'video',
  );

  // sending dump to add/update userVideo document when video is skipped
  const { skip } = userActionType;
  await callLocalGraphqlApi(
    addUserVideoDump(
      userId,
      topicId,
      skip,
    ),
  );

  // this object will be returned in output
  const userSkipVideoData = {};

  // parsing data for topic
  const learningObjectiveData = { type: 'LearningObjective', typeId: `${firstLearningObjectiveId}` };

  // Constructing data as per schema
  Object.assign(userSkipVideoData, {
    learningObjective: learningObjectiveData,
  });

  return userSkipVideoData;
};

export default skipVideoMutationResolver;
