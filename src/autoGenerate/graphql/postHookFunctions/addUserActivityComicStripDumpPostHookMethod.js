import { get } from 'lodash';
import {
  PUBLISHED,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';

// query to get userLO to check if document exists for userId and learningObjectiveId
const userLearningObjectiveQuery = (userId, learningObjectiveId, courseId) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
      {learningObjective_some:{
        id:"${learningObjectiveId}"
      }}
      ${courseId ? `{course_some:{id:"${courseId}"}}` : ''}
      ]
    }){
      id
      comicStripStatus
      learningObjective{
        topic{
          id
          order
          topicComponentRule{
            componentName
            order
            childComponentName
            learningObjective{
              id
              order
              messagesMeta{
                count
              }
              questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
                count
              }
              comicStripsMeta(filter:{status:${PUBLISHED}}){
                count
              }
            }
            blockBasedProject{
              id
              order
            }
            video{
              id
            }
          }
        }
      }
    }
  }
  `;

// query to update user LO based on activity done by user
const updateUserLearningObjectiveMutation = (userLearningObjectiveId,
  isComicStripBookmarked,
  comicStripStatus) => `
  mutation{
    updateUserLearningObjective(id:"${userLearningObjectiveId}",  input:{
      ${typeof isComicStripBookmarked === 'boolean' ? `isComicStripBookmarked: ${isComicStripBookmarked}` : ''}
      comicStripStatus: ${comicStripStatus}
    }){
      id
      chatStatus
      isChatBookmarked
    }
  }
  `;

/*
Current topic component status and
UserLearningObjective(bookmark, comicStripStatus) is updated based on-
  -current topic component status
  -user Learning Objective for provided userId and learning objective id
  -learning objective and topic
*/
const addUserActivityComicStripDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const learningObjectiveId = get(input, 'learningObjective.typeId');
  const courseId = get(input, 'course.typeId');
  if (!userId || !learningObjectiveId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityChatDumpPostHookMethod');
  }
  /*
  getting data for learningObjective from context based on mutationName
  this will be used to get parent topic id for the learning objective
  */
  const learningObjectiveInfo = get(context, `${mutationName}.learningObjective`);
  const topicId = get(learningObjectiveInfo, 'topic.id');
  const { id: learningObjectiveIdInResult } = learningObjectiveInfo;
  /*
  we are getting userLearningObjective for below purpose:
  -we get userLearningObjective id , which will be used further to update the document
  -we use comicStripStatus field to cover the scenario, if user is coming back to a completed comicStrip
    in that case if he is hitting back after chat consumption, status will not get updated
    if it is already completed
  */
  const userLearningObjectiveQueryRes = await callLocalGraphqlApi(userLearningObjectiveQuery(userId, learningObjectiveId, courseId));
  const userLearningObjectiveInfo = get(userLearningObjectiveQueryRes, 'data.userLearningObjectives[0]');
  const {
    id: userLearningObjectiveId,
    comicStripStatus: existingComicStripStatus,
  } = userLearningObjectiveInfo;
  const topicComponentRule = get(userLearningObjectiveInfo, 'learningObjective.topic.topicComponentRule', []);
  const topicOrder = get(userLearningObjectiveInfo, 'learningObjective.topic.order');
  const { complete, incomplete, skip: skipStatus } = userTopicTypeStatus;
  const { next, skip } = userActionType;
  let comicStripStatus = incomplete;
  const { comicStripAction, isBookmarked: isComicStripBookmarked } = input;
  if (comicStripAction && comicStripAction === next) {
    comicStripStatus = complete;
  } else if (comicStripAction && comicStripAction === skip) {
    comicStripStatus = skipStatus;
  }
  /*
 Getting data for user current topic component status from context based on mutationName
 This will be used to cover the case that current component status will only get changed, if
 called component is equal to current component and user has just consumed(next action) it
 And current component status will not get changed when it is already consumed in past
 */
  const currentTopicComponentInfo = get(context, `${mutationName}.userCurrentTopicComponentStatuses`);
  /*
  Calling method to update current user Topic Component status
  */
  await updateCurrentComponentStatusOfNewCourse(
    courseId,
    currentTopicComponentInfo,
    comicStripAction,
    topicId,
    learningObjectiveIdInResult,
    '',
    '',
    'comicStrip',
    topicComponentRule,
    topicOrder,
  );
  // if existing chatStatus is complete, it will remain complete
  if (userLearningObjectiveInfo
      && existingComicStripStatus === complete) {
    comicStripStatus = complete;
  }

  if (!userLearningObjectiveId) {
    log('Not able to fetch LearningObjective.topic in addUserActivityChatDumpPostHookMethod');
  }
  /*
  updating user Learning Objective document on the basis of
  isChatBookmarked, user action(next, back etc) in input
  */
  await callLocalGraphqlApi(updateUserLearningObjectiveMutation(
    userLearningObjectiveId,
    isComicStripBookmarked,
    comicStripStatus,
  ));
  return true;
};

export default addUserActivityComicStripDumpPostHookMethod;
