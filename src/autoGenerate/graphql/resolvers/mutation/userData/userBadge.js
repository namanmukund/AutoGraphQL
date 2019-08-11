import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../../../constants';
import {
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
// const getBadgeQuery = () => `
//     query{
//       badges(
//         filter:{
//           status:${PUBLISHED}
//         }
//       ){
//         id
//         name
//         order
//         type
//         activeImage{
//           id
//           uri
//           name
//         }
//         inactiveImage{
//           id
//           uri
//           name
//         }
//         topic{
//           id
//           order
//         }
//       }
//     }
//   `;


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
    // currentTopic,
  } = currentTopicComponentInfo;
  // const { order: currentTopicOrder } = currentTopic;
  // console.log('---------------------------currentTopicOrder', currentTopicOrder);
  // calling method to get all published badges
  // const userBadgeRes = await callGraphqlApi(
  //   getBadgeQuery(),
  //   '',
  //   '',
  //   '',
  //   token,
  // );
  // console.log('---------------------------userBadgeRes', userBadgeRes);
  // const userBadgeInfo = get(userBadgeRes, 'data.badges');
  // console.log('---------------------------userBadgeInfo', userBadgeInfo);
  // this object will be returned in output
  const userBadgeDocument = {};
  // const characters = [];
  // const equipments = [];

  // iterating over chapters to construct data for homepage
  // chapters.forEach((chapter) => {
  //   if (!chapter || !chapter.topics || !chapter.topics.length) {
  //     throw new DatabaseRecordNotFoundError({
  //       data: {
  //         error: 'CurrentCourse.chapter.topics: is not present',
  //       },
  //     });
  //   }
  //   totalTopics += chapter.topics.length;
  //   // iterating over topics of each chapter  and setting isUnlocked field
  //   chapter.topics.forEach((topic) => {
  //     const { order: topicOrder } = topic;
  //     // checking logic for is topic Unlocked or not
  //     let isUnlocked = false;
  //     if (
  //       topicOrder <= currentTopicOrder
  //     ) {
  //       isUnlocked = true;
  //     }
  //     Object.assign(topic, { isUnlocked });
  //   });
  // });
  Object.assign(userBadgeDocument, {
    currentCourse,
  });
  return userBadgeDocument;
};

export default userBadgeMutationResolver;
