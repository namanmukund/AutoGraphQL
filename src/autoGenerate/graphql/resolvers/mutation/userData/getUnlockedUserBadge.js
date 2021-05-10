import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
  UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
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

// query to get badge belonging to a topic and unlockPoint(video/quiz)
const getBadgeQuery = (
  topicId,
  unlockPoint,
) => `
 query{
    badges(
      filter:{
        and:[
          {topic_some:{
            id: "${topicId}"
          }},
          {
            unlockPoint: ${unlockPoint}
          },
          {
            status:${PUBLISHED}
          }
        ]
      }
    ){
      id
    }
  }
  `;

// query to get batch status
const getBatchStatus = (userId) => `
  query{
    user(id: "${userId}"){
      studentProfile{
        batch{
          id
          type
          currentComponent{
            currentCourse{
              id
              order
            }
            currentTopic{
              id
              order
            }
            latestSessionStatus
          }
        }
      }
    }
  }
  `;

/*
This is called when user clicks next on video/quiz
It will return  badge if user is on that component otherwise will return no badge
*/
const getUnlockedUserBadgeMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  /*
  Calling method to get userId through the token
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  if (!userId) {
    throw new UnauthenticatedUserError();
  }
  const { topicId: inputTopicId, component: inputComponent } = params;
  if (!inputTopicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
  }
  if (!inputComponent) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Component is not present',
      },
    });
  }
  let displayBadge = false;
  let badgeId = '';
  // getting token to be sent in callLocalGraphqlApi method
  const res = await callLocalGraphqlApi(getUserCurrentTopicComponentStatus(userId), context, '');
  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
  // calling method to validate user current topic component status
  validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
  const batchRes = await callLocalGraphqlApi(
    getBatchStatus(userId),
    context,
    '',
  );

  const batchCurrentComponentInfo = get(batchRes, 'data.user.studentProfile.batch.currentComponent');

  let currentTopicId = get(currentTopicComponentInfo, 'currentTopic.id');
  const currentTopicComponent = get(currentTopicComponentInfo, 'currentTopicComponentType');

  if (batchCurrentComponentInfo) {
    currentTopicId = batchCurrentComponentInfo && batchCurrentComponentInfo.currentTopic && batchCurrentComponentInfo.currentTopic.id;
  }
  // badge will only be returned in case user is on that particular topic and component
  // in alll other cases displayBadge will remain false
  if (inputTopicId === currentTopicId && ((inputComponent === currentTopicComponent))) {
    // calling method to get all published badges
    const badgeRes = await callLocalGraphqlApi(
      getBadgeQuery(inputTopicId, inputComponent),
      context,
      '',
    );
    const badgeInfo = get(badgeRes, 'data.badges');
    displayBadge = true;
    if (badgeInfo.length) {
      // assumption is that there will only be one document for a topic and component
      // in case there are more docs, that at index 0 will be returned
      badgeId = badgeInfo[0].id;
    }
  }
  // this object will be returned in output
  const getUnlockedUserBadgeDocument = {};
  const badge = { type: 'Badge', typeId: `${badgeId}` };
  Object.assign(getUnlockedUserBadgeDocument, {
    badge,
    displayBadge,
  });
  return getUnlockedUserBadgeDocument;
};

export default getUnlockedUserBadgeMutationResolver;
