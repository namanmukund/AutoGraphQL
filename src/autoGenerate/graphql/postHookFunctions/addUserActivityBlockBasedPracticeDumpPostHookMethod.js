import { get } from 'lodash';
import {
  PUBLISHED,
  userActionType,
  userTopicTypeStatus,
} from '../../../../constants';
import { log } from '../../../../utils';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import updateCurrentComponentStatusOfNewCourse from './utils/updateCurrentComponentStatusOfNewCourse';

// query to get userLO to check if document exists for userId, blockBasedPracticeId and topicId
const userBlockBasedPracticeQuery = (userId, topicId, blockBasedPracticeId) => `
  query{
    userBlockBasedPractices(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
        {blockBasedPractice_some:{
          id:"${blockBasedPracticeId}"
        }},
        {topic_some:{
          id:"${topicId}"
        }}
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
  `;

// query to update user LO based on activity done by user
const updateUserBlockBasedPracticeMutation = (userBlockBasedPracticeId,
  blockBasedPracticeStatus,
  answerLink) => `
  mutation{
    updateUserBlockBasedPractice(id:"${userBlockBasedPracticeId}",  input:{
      ${answerLink ? `answerLink: ${answerLink}` : ''}
      status: ${blockBasedPracticeStatus}
    }){
      id
      status
    }
  }
  `;

/*
Current topic component status and
UserActivityBlockBasedPractice(answerLink) is updated based on-
  -current topic component status
  -user BlockBasedPractice for provided userId, blockBasedPractice id and topic id
*/
const addUserActivityBlockBasedPracticeDumpPostHookMethod = async (input, mutationName, context) => {
  console.log('--------------------------------ololo');
  const userId = get(input, 'user.typeId');
  const blockBasedPracticeId = get(input, 'blockBasedPractice.typeId');
  const courseId = get(input, 'course.typeId');
  const topicId = get(input, 'topic.typeId');
  if (!userId || !topicId) {
    log('Either one of userId or learningObjectiveId is missing in input of addUserActivityBlockBasedPracticeDumpPostHookMethod');
  }

  /*
  we are getting UserBlockBasedPractice for below purpose:
  -we get UserBlockBasedPractice id , which will be used further to update the document
  -we use status field to cover the scenario, if user is coming back to a completed UserBlockBasedPractice
    in that case if he is hitting back after blockBasedPractice consumption, status will not get updated
    if it is already completed
  */
  const userBlockBasedPracticeQueryRes = await callLocalGraphqlApi(userBlockBasedPracticeQuery(userId, topicId, blockBasedPracticeId));
  const userBlockBasedPracticeInfo = get(userBlockBasedPracticeQueryRes, 'data.userBlockBasedPractices[0]');
  console.log('--------------------------userBlockBasedPracticeInfo', userBlockBasedPracticeInfo);
  const {
    id: userBlockBasedPracticeId,
    status: existingBlockBasedPracticeStatus,
    answerLink,
  } = userBlockBasedPracticeInfo;
  const topicComponentRule = get(userBlockBasedPracticeInfo, 'topic.topicComponentRule', []);
  const topicOrder = get(userBlockBasedPracticeInfo, 'topic.order');
  const { complete, incomplete, skip: skipStatus } = userTopicTypeStatus;
  const { next, skip } = userActionType;
  let blockBasedPracticeStatus = incomplete;
  const { blockBasedPracticeAction } = input;
  if (blockBasedPracticeAction && blockBasedPracticeAction === next) {
    blockBasedPracticeStatus = complete;
  } else if (blockBasedPracticeAction && blockBasedPracticeAction === skip) {
    blockBasedPracticeStatus = skipStatus;
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
    blockBasedPracticeAction,
    topicId,
    '',
    blockBasedPracticeId,
    '',
    'blockBasedPractice',
    topicComponentRule,
    topicOrder,
  );
  // if existing chatStatus is complete, it will remain complete
  if (userBlockBasedPracticeInfo
      && existingBlockBasedPracticeStatus === complete) {
    blockBasedPracticeStatus = complete;
  }

  if (!userBlockBasedPracticeId) {
    log('Not able to fetch userBlockBasedPracticeId in addUserActivityBlockBasedPracticeDumpPostHookMethod');
  }
  /*
  updating user blockBasedPractice document on the basis of
  answerLink, user action(next, back etc) in input
  */
  await callLocalGraphqlApi(updateUserBlockBasedPracticeMutation(
    userBlockBasedPracticeId,
    blockBasedPracticeStatus,
    answerLink,
  ));
  return true;
};

export default addUserActivityBlockBasedPracticeDumpPostHookMethod;
