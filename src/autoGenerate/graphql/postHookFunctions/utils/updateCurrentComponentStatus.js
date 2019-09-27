import { get } from 'lodash';
import callGraphqlApi from '../../../../api/callGraphqlApi';
import { log } from '../../../../../utils';
import { topicTypes, userActionType } from '../../../../../constants';

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = (
  currentTopicComponentId,
  loQuery,
  topicQuery,
  nextCurrentTopicComponentType,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${nextCurrentTopicComponentType}
    },
    ${topicQuery}
    ${loQuery}
    ){
      id
    }
  }
  `;

/*
Method to check whether user current topic status should be updated,
Conditions are written in switchblocks
*/
const updateCurrentComponentStatus = (
  currentTopicComponentInfo,
  userAction,
  topicId,
  learningObjectiveId,
  page,
  nextComponentType,
  completedQuestionCount,
  totalQuestions,
  nextComponentLearningObjectiveId,
  nextComponentTopicId,
) => {
  const { video, message, practiceQuestion, quiz } = topicTypes;
  const { next, skip } = userActionType;
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentLearningObjective,
    currentTopic,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopic in addUserActivityChatDumpPostHookMethod');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopicComponentType in addUserActivityChatDumpPostHookMethod');
  }
  const { id: currentTopicId } = currentTopic;
  let loQuery = '';
  let topicQuery = '';
  let nextCurrentTopicComponentType = '';
  let currentLearningObjectiveId;
  let updateUserCurrentTopicComponentStatus = false;
  // page wise conditions to check whether UserCurrentTopicComponentStatus should be updated
  switch (page) {
    case video:
      nextCurrentTopicComponentType = message;
      /*
      We are checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'video'
      -called topic in input should be equal to current topic
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next || userAction === skip) &&
        currentTopicComponent === video &&
        currentTopicId === topicId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case message:
      nextCurrentTopicComponentType = practiceQuestion;
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in addUserActivityChatDumpPostHookMethod');
      }
      currentLearningObjectiveId = get(currentLearningObjective, 'id');
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'message'
      -called topic in input should be equal to current topic and
      -called learningObjective in input should be equal to current learningObjective
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if (userAction === next &&
        currentTopicComponent === message &&
        currentTopicId === topicId &&
        currentLearningObjectiveId === learningObjectiveId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case practiceQuestion:
      // logic for checking the next component, it will either be chat of next LO or quiz
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in addUserActivityChatDumpPostHookMethod');
      }
      currentLearningObjectiveId = get(currentLearningObjective, 'id');
      if (nextComponentType === quiz) {
        nextCurrentTopicComponentType = quiz;
      } else if (nextComponentLearningObjectiveId) {
        nextCurrentTopicComponentType = message;
        loQuery = `currentLearningObjectiveConnectId:"${nextComponentLearningObjectiveId}"`;
      }
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -all practice questions would be in completed state
      -current topic component should be 'practiceQuestion'
      -called topic in input should be equal to current topic and
      -called learningObjective in input should be equal to current learningObjective
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if (
        (
          userAction === skip &&
          currentTopicId === topicId &&
          currentLearningObjectiveId === learningObjectiveId
        ) ||
        (
          userAction === next &&
          completedQuestionCount === totalQuestions &&
          currentTopicComponent === practiceQuestion &&
          currentTopicId === topicId &&
          currentLearningObjectiveId === learningObjectiveId
        )
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case quiz:
      nextCurrentTopicComponentType = video;
      /*
      We are checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'quiz'
      -called topic in input should be equal to current topic and
      -next published topic is present in the database, if it is not present we are assuming that it
      -was the last topic in the course
      Above conditions covers the case that current component status will only get changed, if
      called component is  is equal to current component and user has just consumed(next action) it
      And current component status will not get changed when it is already consumed in past
      */
      if (userAction === next &&
        currentTopicComponent === quiz &&
        currentTopicId === topicId &&
        nextComponentTopicId
      ) {
        if (nextComponentLearningObjectiveId) { loQuery = `currentLearningObjectiveConnectId:"${nextComponentLearningObjectiveId}"`; }
        if (nextComponentTopicId) { topicQuery = `currentTopicConnectId:"${nextComponentTopicId}"`; }
        // updating current component in case quiz is completed by user
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    default:
  }
  /*
  updating UserCurrentTopicComponentStatus based on flag updateUserCurrentTopicComponentStatus
  which becomes only true according to page and conditions above
  */
  if (updateUserCurrentTopicComponentStatus) {
    callGraphqlApi(updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      loQuery,
      topicQuery,
      nextCurrentTopicComponentType,
    ));
  }
  return true;
};

export default updateCurrentComponentStatus;

