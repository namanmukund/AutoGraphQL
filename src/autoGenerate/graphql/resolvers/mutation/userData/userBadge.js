import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  badgeTypes,
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
      currentCourse{
        id
        title
      }
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

// query to get all badges in a course along with the topic
const getBadgeQuery = () => `
    query{
      badges(
        filter:{
          status:${PUBLISHED}
        }
      ){
        id
        name
        order
        type
        activeImage{
          id
          uri
          name
        }
        inactiveImage{
          id
          uri
          name
        }
        topic{
          id
          order
        }
      }
    }
  `;

// method to sort bade array according to topic order and order inside of a topic
// it will take a array which is already sorted topic order wise
const sortBadges = (badges) => {
  const sortedArray = [];
  // tempArray is storing objects of same topic temporarily
  const tempArray = [];
  badges.forEach((badge, index) => {
    if (index === 0) {
      tempArray.push(badge);
    } else if (badge.topic.order === badges[index - 1].topic.order) {
      tempArray.push(badge);
    } else {
      // sorting badges of a topic which are stored in tempArray
      tempArray.sort((a, b) => a.order - b.order);
      sortedArray.push(...tempArray);
      tempArray.length = 0;
      tempArray.push(badge);
    }
  });
  // after end of loop there will be entries left in tempArray for last topic
  if (tempArray.length) {
    tempArray.sort((a, b) => a.order - b.order);
    sortedArray.push(...tempArray);
    tempArray.length = 0;
  }
  return sortedArray;
};

// method to parse badges according to return type
const parseBadges = (badges, currentTopicOrder) => {
  const finalCharacters = [];
  badges.forEach((badge, index) => {
    const tempObj = {};
    const { name, activeImage, inactiveImage, topic } = badge;
    let isUnlocked = false;
    let imageId = '';
    if (inactiveImage) { imageId = inactiveImage.id; }
    // badge will be unlocked if that topic is unlocked
    if (topic.order <= currentTopicOrder) {
      isUnlocked = true;
      if (activeImage) { imageId = activeImage.id; }
    }
    const image = { type: 'File', typeId: `${imageId}` };
    const order = index + 1;
    Object.assign(tempObj, { name, isUnlocked, image, order });
    finalCharacters.push(tempObj);
  });
  return finalCharacters;
};

/*
This is called when user tries to get badges on profile
It will return all the badges(characters and equipments)
with their locked/unlocked status based on User current topic component status
It also returns the current course of the user.
*/
const userBadgeMutationResolver = async (
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

  // throwing error if userId is not present in the token
  if (!userId) {
    throw new UnauthenticatedUserError();
  }
  // if we get userId through token, then we will return badges for that user
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

  const {
    currentCourse,
    currentTopic,
  } = currentTopicComponentInfo;
  const { order: currentTopicOrder } = currentTopic;

  // calling method to get all published badges
  const badgeRes = await callGraphqlApi(
    getBadgeQuery(),
    '',
    '',
    '',
    token,
  );
  const badgeInfo = get(badgeRes, 'data.badges');
  // this object will be returned in output
  const userBadgeDocument = {};
  // storing characters and equipments in separate arrays, initialising both arrays
  const charactersFromBadgeInfo = [];
  const equipmentsFromBadgeInfo = [];
  const { character, equipment } = badgeTypes;
  badgeInfo.forEach((badge) => {
    if (
      !badge ||
      !badge.type ||
      !badge.topic ||
      !badge.name ||
      !badge.order ||
      !badge.topic.order) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Badge: Wrong/Incomplete information stored in badge',
        },
      });
    }
    if (badge.type === character) {
      charactersFromBadgeInfo.push(badge);
    } else if (badge.type === equipment) {
      equipmentsFromBadgeInfo.push(badge);
    }
  });
  // sorting each badge array according to topic order
  charactersFromBadgeInfo.sort((a, b) => a.topic.order - b.topic.order);
  equipmentsFromBadgeInfo.sort((a, b) => a.topic.order - b.topic.order);
  // getting parsed characters and equipments to be sent in result
  const characters = parseBadges(sortBadges(charactersFromBadgeInfo), currentTopicOrder);
  const equipments = parseBadges(sortBadges(equipmentsFromBadgeInfo), currentTopicOrder);
  userBadgeDocument.characters = characters;
  userBadgeDocument.equipments = equipments;
  Object.assign(userBadgeDocument, {
    currentCourse,
  });
  return userBadgeDocument;
};

export default userBadgeMutationResolver;
