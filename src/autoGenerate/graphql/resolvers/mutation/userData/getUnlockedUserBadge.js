import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
  UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';

// query to get current component status of user
const getUserCurrentTopicComponentStatus = userId => `
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
  // getting token to be sent in callGraphqlApi method
  const { authorization: token } = context;
  const res = await callGraphqlApi(
    getUserCurrentTopicComponentStatus(userId),
    '',
    '',
    '',
    token,
  );
  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
  // calling method to validate user current topic component status
  validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
  const currentTopicId = get(currentTopicComponentInfo, 'currentTopic.id');
  const currentTopicComponent = get(currentTopicComponentInfo, 'currentTopicComponentType');
  // badge will only be returned in case user is on that particular topic and component
  // in alll other cases displayBadge will remain false
  if (inputTopicId === currentTopicId && inputComponent === currentTopicComponent) {
    // calling method to get all published badges
    const badgeRes = await callGraphqlApi(
      getBadgeQuery(inputTopicId, inputComponent),
      '',
      '',
      '',
      token,
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
