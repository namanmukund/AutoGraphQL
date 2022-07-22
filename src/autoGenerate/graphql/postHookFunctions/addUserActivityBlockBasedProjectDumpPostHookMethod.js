import { get } from 'lodash';
import {
  PUBLISHED,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';

// query to get userLO to check if document exists for userId, blockBasedProjectId and topicId
const userBlockBasedProjectQuery = (userId, topicId, blockBasedProjectId, courseId) => `
  query{
    userBlockBasedProjects(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
        {blockBasedProject_some:{
          id:"${blockBasedProjectId}"
        }},
        {topic_some:{
          id:"${topicId}"
        }}
         ${courseId ? `{course_some:{id:"${courseId}"}}` : ''}
      ]
    }){
      id
      status
      topic{
        id
        order
        topicComponentRule{
          componentName
          order
          childComponentName
          learningObjectiveComponentsRule {
            componentName
            order
          }
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
            learningSlides(filter:{status:${PUBLISHED}}){
              id
            }
            learningSlidesMeta(filter:{status:${PUBLISHED}}){
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
  `;

// query to update user LO based on activity done by user
const updateUserBlockBasedProjectMutation = (userBlockBasedProjectId,
  blockBasedProjectStatus,
  answerLink, savedBlocks, startTime, endTime) => `
  mutation{
    updateUserBlockBasedProject(id:"${userBlockBasedProjectId}",  input:{
      ${answerLink ? `answerLink: "${answerLink}"` : ''}
      ${savedBlocks ? `savedBlocks: "${savedBlocks}"` : ''}
      status: ${blockBasedProjectStatus}
      ${startTime ? `startTime: "${startTime}"` : ''}
      ${endTime ? `endTime: "${endTime}"` : ''}
    }){
      id
      status
    }
  }
  `;

/*
Current topic component status and
UserActivityBlockBasedProject(answerLink) is updated based on-
  -current topic component status
  -user BlockBasedProject for provided userId, blockBasedProject id and topic id
*/
const addUserActivityBlockBasedProjectDumpPostHookMethod = async (input, mutationName, context) => {
  const userId = get(input, 'user.typeId');
  const blockBasedProjectId = get(input, 'blockBasedProject.typeId');
  const courseId = get(input, 'course.typeId');
  const topicId = get(input, 'topic.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in input of addUserActivityBlockBasedProjectDumpPostHookMethod');
  }

  /*
  we are getting UserBlockBasedProject for below purpose:
  -we get UserBlockBasedProject id , which will be used further to update the document
  -we use status field to cover the scenario, if user is coming back to a completed UserBlockBasedProject
    in that case if he is hitting back after blockBasedProject consumption, status will not get updated
    if it is already completed
  */
  const userBlockBasedProjectQueryRes = await callLocalGraphqlApi(userBlockBasedProjectQuery(userId, topicId, blockBasedProjectId, courseId), context);
  const userBlockBasedProjectInfo = get(userBlockBasedProjectQueryRes, 'data.userBlockBasedProjects[0]');

  const {
    id: userBlockBasedProjectId,
    status: existingBlockBasedProjectStatus,
  } = userBlockBasedProjectInfo;
  const {
    answerLink,
    savedBlocks,
    startTime,
    endTime,
  } = input;

  const topicComponentRule = get(userBlockBasedProjectInfo, 'topic.topicComponentRule', []);
  const topicOrder = get(userBlockBasedProjectInfo, 'topic.order');
  const { complete, incomplete, skip: skipStatus } = userTopicTypeStatus;
  const { next, skip } = userActionType;
  let blockBasedProjectStatus = incomplete;
  const { blockBasedProjectAction } = input;
  if (blockBasedProjectAction && blockBasedProjectAction === next) {
    blockBasedProjectStatus = complete;
  } else if (blockBasedProjectAction && blockBasedProjectAction === skip) {
    blockBasedProjectStatus = skipStatus;
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
    userId,
    courseId,
    currentTopicComponentInfo,
    blockBasedProjectAction,
    topicId,
    '',
    blockBasedProjectId,
    '',
    'blockBasedProject',
    topicComponentRule,
    topicOrder,
  );
  // if existing chatStatus is complete, it will remain complete
  if (userBlockBasedProjectInfo
      && existingBlockBasedProjectStatus === complete) {
    blockBasedProjectStatus = complete;
  }

  if (!userBlockBasedProjectId) {
    log('Not able to fetch userBlockBasedProjectId in addUserActivityBlockBasedProjectDumpPostHookMethod');
  }
  /*
  updating user blockBasedProject document on the basis of
  answerLink, user action(next, back etc) in input
  */
  await callLocalGraphqlApi(updateUserBlockBasedProjectMutation(
    userBlockBasedProjectId,
    blockBasedProjectStatus,
    answerLink,
    savedBlocks,
    startTime,
    endTime,
  ));
  return true;
};

export default addUserActivityBlockBasedProjectDumpPostHookMethod;
