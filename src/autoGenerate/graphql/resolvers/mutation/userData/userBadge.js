import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  badgeTypes,
  topicTypes,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
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
        description
        order
        type
        unlockPoint
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

// query to get a course
const getCourseQuery = () => `
    query{
      courses(filter:{
        and:[
          {title: ${GLOBAL_COURSE_TITLE}},
          {status: ${PUBLISHED}}
        ]
      }){
        id
        title
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

const { video, quiz } = topicTypes;

// method to sort badge array according to topic order and order inside of a topic
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
const parseBadges = (badges, currentTopicOrder, currentTopicComponent) => {
  const finalCharacters = [];
  badges.forEach((badge, index) => {
    const tempObj = {};
    const {
      name, description, activeImage, inactiveImage, topic, unlockPoint,
    } = badge;
    let isUnlocked = false;
    let imageId = '';
    if (inactiveImage) { imageId = inactiveImage.id; }
    // badge will be unlocked if that topic is unlocked
    if (topic.order < currentTopicOrder) {
      isUnlocked = true;
      if (activeImage) { imageId = activeImage.id; }
    } else if (topic.order === currentTopicOrder
      && (currentTopicComponent !== video && unlockPoint === video)
    ) {
      isUnlocked = true;
      if (activeImage) { imageId = activeImage.id; }
    }
    const image = { type: 'File', typeId: `${imageId}` };
    const order = index + 1;
    Object.assign(tempObj, {
      name, description, isUnlocked, image, order, unlockPoint,
    });
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

  // calling method to get all published badges
  const badgeRes = await callLocalGraphqlApi(getBadgeQuery());
  const badgeInfo = get(badgeRes, 'data.badges');
  // this object will be returned in output
  const userBadgeDocument = {};
  // storing characters and equipments in separate arrays, initialising both arrays
  const charactersFromBadgeInfo = [];
  const equipmentsFromBadgeInfo = [];
  const { character, equipment } = badgeTypes;
  badgeInfo.forEach((badge) => {
    if (
      !badge
      || !badge.type
      || !badge.topic
      || !badge.name
      || !badge.order
      || !badge.unlockPoint
      || !badge.topic.order) {
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
  let currentCourse;
  let currentTopicOrder;
  let currentTopicComponentType;
  // Handling cases for guest user, in case guest user is accessing this API
  // we will return all inactive images
  if (userId) {
    // if we get userId through token, then we will return badges for that user
    const res = await callLocalGraphqlApi(
      getUserCurrentTopicComponentStatus(userId),
      context,
      '',
    );
    const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
    // calling method to validate user current topic component status
    validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
    currentCourse = get(currentTopicComponentInfo, 'currentCourse');
    currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');
    currentTopicComponentType = get(currentTopicComponentInfo, 'currentTopicComponentType');

    // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
    const batchRes = await callLocalGraphqlApi(
      getBatchStatus(userId),
      context,
      '',
    );

    const batchCurrentComponentInfo = get(batchRes, 'data.user.studentProfile.batch.currentComponent');

    if (batchCurrentComponentInfo) {
      currentTopicOrder = batchCurrentComponentInfo && batchCurrentComponentInfo.currentTopic && batchCurrentComponentInfo.currentTopic.order;
      currentTopicComponentType = quiz;
    }
  } else {
    const courseResult = await callLocalGraphqlApi(getCourseQuery());
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python',
        },
      });
    }
    currentCourse = course[0];
    // Setting topic order as -1 and currentTopicComponentType as video for guest user,
    // this way all inactive images will be returned
    currentTopicOrder = -1;
    currentTopicComponentType = video;
    // Setting app name to that of backend as we are fetching images ahead
    Object.assign(context.currentApp, {
      name: 'core',
    });
  }
  // getting parsed characters and equipments to be sent in result
  const characters = parseBadges(
    sortBadges(charactersFromBadgeInfo),
    currentTopicOrder,
    currentTopicComponentType,
  );
  const equipments = parseBadges(
    sortBadges(equipmentsFromBadgeInfo),
    currentTopicOrder,
    currentTopicComponentType,
  );
  userBadgeDocument.characters = characters;
  userBadgeDocument.equipments = equipments;
  Object.assign(userBadgeDocument, {
    currentCourse,
  });
  return userBadgeDocument;
};

export default userBadgeMutationResolver;
