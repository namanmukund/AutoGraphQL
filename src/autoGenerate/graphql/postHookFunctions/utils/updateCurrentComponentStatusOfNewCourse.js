/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import { log } from '../../../../../utils';
import {
  PUBLISHED, topicComponents, topicTypes, userActionType,
} from '../../../../../constants';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import isUserInheritedFromMentor from './isMentorChild';

// query to get next topic
const getNextTopic = (courseId,
  order) => `
  query{
    topics(filter:{
      and:[
        {courses_some:{id: "${courseId}"}}
        {order_gt: ${order}}
        {status: ${PUBLISHED}}
      ]
    }, orderBy: order_ASC, first: 1){
      id
      order
      topicComponentRule{
        componentName
        order
        learningObjective{
          id
          learningSlides(filter:{status:${PUBLISHED}}){
            id
          }
          messagesMeta{
            count
          }
          questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:${PUBLISHED}}]}){
            count
          }
          comicStripsMeta(filter:{status:${PUBLISHED}}){
            count
          }
          learningSlidesMeta(filter:{status:${PUBLISHED}}){
            count
          }
        }
        blockBasedProject{
          id
        }
        video{
          id
        }
      }
    }
  }
  `;

// query to update user current topic component status
const updateUserCurrentTopicComponentStatusMutation = (
  currentTopicComponentId,
  loQuery,
  topicQuery,
  videoQuery,
  blockBasedProjectQuery,
  nextCurrentTopicComponentType,
  learningSlideQuery,
) => `
  mutation{
    updateUserCurrentTopicComponentStatus(id:"${currentTopicComponentId}",  input:{
      currentTopicComponentType: ${nextCurrentTopicComponentType}
    },
    ${topicQuery}
    ${loQuery}
    ${videoQuery}
    ${blockBasedProjectQuery}
    ${learningSlideQuery}
    ){
      id
    }
  }
  `;

/*
Method to check whether user current topic status should be updated,
Conditions are written in switchblocks
*/
const updateCurrentComponentStatusOfNewCourse = async (
  userId,
  courseId,
  currentTopicComponentInfo,
  userAction,
  topicId,
  learningObjectiveId,
  blockBasedProjectId,
  videoId,
  page,
  topicComponentRule,
  topicOrder,
  completedQuestionCount,
  totalQuestions,
  isLastLearningSlide,
  learningSlideId,
) => {
  const checkForMentorChild = await isUserInheritedFromMentor(userId, true);
  if (checkForMentorChild) return true;
  const {
    video, message, practiceQuestion, comicStrip, quiz, blockBasedPractice, blockBasedProject, learningSlide,
  } = topicTypes;
  const { assignment, homeworkAssignment, homeworkPractice } = topicComponents;
  const sortedTopicComponentRule = topicComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
  const { next, skip } = userActionType;
  const {
    id: currentTopicComponentId,
    currentTopicComponentType: currentTopicComponent,
    currentLearningObjective,
    currentTopic,
    currentBlockBasedProject,
    currentVideo,
  } = currentTopicComponentInfo;
  if (!currentTopic) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopic in updateUserCurrentComponent method');
  }
  if (!currentTopicComponent) {
    log('Not able to fetch CurrentTopicComponentInfo.CurrentTopicComponentType in updateUserCurrentComponent method');
  }
  const { id: currentTopicId } = currentTopic;
  let loQuery = '';
  let topicQuery = '';
  let videoQuery = '';
  let blockBasedProjectQuery = '';
  let nextCurrentTopicComponent = {};
  let nextCurrentTopicComponentType = '';
  let currentLearningObjectiveId;
  let currentBlockBasedProjectId;
  let currentVideoId;
  let updateUserCurrentTopicComponentStatus = false;
  let currentComponentIndex;
  let nextComponentIndex;
  let toUpdateLearningSlide = false;
  let learningSlideQuery = '';
  // page wise conditions to check whether UserCurrentTopicComponentStatus should be updated
  switch (page) {
    case video:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.video && comp.video.id === videoId);
      nextComponentIndex = currentComponentIndex + 1;
      if (!currentVideo) {
        log('Not able to fetch CurrentTopicComponentInfo.currentVideo in updateUserCurrentComponent method');
      }
      currentVideoId = get(currentVideo, 'id');
      /*
      We are checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'video'
      -called topic in input should be equal to current topic
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next || userAction === skip)
        // && currentTopicComponent === video /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
        && currentVideoId === videoId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case comicStrip:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.learningObjective && comp.learningObjective.id === learningObjectiveId);
      nextComponentIndex = currentComponentIndex + 1;
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in updateUserCurrentComponent method');
      }
      currentLearningObjectiveId = get(currentLearningObjective, 'id');
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'comicStrip'
      -called topic in input should be equal to current topic and
      -called learningObjective in input should be equal to current learningObjective
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next || userAction === skip)
        // && currentTopicComponent === comicStrip /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
        && currentLearningObjectiveId === learningObjectiveId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case message:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.learningObjective && comp.learningObjective.id === learningObjectiveId);
      nextComponentIndex = currentComponentIndex + 1;
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in updateUserCurrentComponent method');
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
      if ((userAction === next || userAction === skip)
        // && currentTopicComponent === message /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
        && currentLearningObjectiveId === learningObjectiveId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case practiceQuestion:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.learningObjective && comp.learningObjective.id === learningObjectiveId);
      nextComponentIndex = currentComponentIndex + 1;
      // logic for checking the next component, it will either be chat of next LO or quiz
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in addUserActivityChatDumpPostHookMethod');
      }
      currentLearningObjectiveId = get(currentLearningObjective, 'id');
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
          userAction === skip
          && currentTopicId === topicId
          && currentLearningObjectiveId === learningObjectiveId
        )
        || (
          userAction === next
          && completedQuestionCount === totalQuestions
          // && (currentTopicComponent === practiceQuestion
          //   || currentTopicComponent === message
          // ) /** Temporarily removed to bypass check and eventually update to next component / topic */
          && currentTopicId === topicId
          && currentLearningObjectiveId === learningObjectiveId
        )
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case learningSlide:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.learningObjective && comp.learningObjective.id === learningObjectiveId);
      nextComponentIndex = currentComponentIndex + 1;
      // logic for checking the next component, it will either be chat of next LO or quiz
      if (!currentLearningObjective) {
        log('Not able to fetch CurrentTopicComponentInfo.currentLearningObjective in addUserActivityChatDumpPostHookMethod');
      }
      currentLearningObjectiveId = get(currentLearningObjective, 'id');
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
          userAction === skip
          && currentTopicId === topicId
          && currentLearningObjectiveId === learningObjectiveId
        )
        || (
          userAction === next
          // && (currentTopicComponent === practiceQuestion
          //   || currentTopicComponent === message
          // ) /** Temporarily removed to bypass check and eventually update to next component / topic */
          && currentTopicId === topicId
          && currentLearningObjectiveId === learningObjectiveId
        )
      ) {
        if (isLastLearningSlide) {
          updateUserCurrentTopicComponentStatus = true;
        }
        toUpdateLearningSlide = true;
      }
      break;
    case assignment:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.componentName === 'assignment');
      nextComponentIndex = currentComponentIndex + 1;
      /*
      We are checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'assignment'
      -called topic in input should be equal to current topic and
      -next published topic is present in the database, if it is not present we are assuming that it
      -was the last topic in the course
      Above conditions covers the case that current component status will only get changed, if
      called component is  is equal to current component and user has just consumed(next action) it
      And current component status will not get changed when it is already consumed in past
      */
      if (userAction === next
        // && currentTopicComponent === quiz /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
      ) {
        // updating current component in case quiz is completed by user
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case quiz:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.componentName === quiz);
      nextComponentIndex = currentComponentIndex + 1;
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
      if (userAction === next
        // && currentTopicComponent === quiz /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
      ) {
        // updating current component in case quiz is completed by user
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case homeworkAssignment:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.componentName === 'homeworkAssignment');
      nextComponentIndex = currentComponentIndex + 1;
      /*
      We are checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'homeworkAssignment'
      -called topic in input should be equal to current topic and
      -next published topic is present in the database, if it is not present we are assuming that it
      -was the last topic in the course
      Above conditions covers the case that current component status will only get changed, if
      called component is  is equal to current component and user has just consumed(next action) it
      And current component status will not get changed when it is already consumed in past
      */
      if (userAction === next
        // && currentTopicComponent === quiz /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
      ) {
        // updating current component in case quiz is completed by user
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case homeworkPractice:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.blockBasedProject && comp.blockBasedProject.id === blockBasedProjectId);
      nextComponentIndex = currentComponentIndex + 1;
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'blockBasedProject'
      -called topic in input should be equal to current topic and
      -called blockBasedProject in input should be equal to current blockBasedProject
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next)
        // && currentTopicComponent === blockBasedProject /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case blockBasedProject:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.blockBasedProject && comp.blockBasedProject.id === blockBasedProjectId);
      nextComponentIndex = currentComponentIndex + 1;
      if (!currentBlockBasedProject) {
        log('Not able to fetch CurrentTopicComponentInfo.currentBlockBasedProject in updateUserCurrentComponent method');
      }
      currentBlockBasedProjectId = get(currentBlockBasedProject, 'id');
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'blockBasedProject'
      -called topic in input should be equal to current topic and
      -called blockBasedProject in input should be equal to current blockBasedProject
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next || userAction === skip)
        // && currentTopicComponent === blockBasedProject /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
        && currentBlockBasedProjectId === blockBasedProjectId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    case blockBasedPractice:
      currentComponentIndex = sortedTopicComponentRule.findIndex((comp) => comp.blockBasedProject && comp.blockBasedProject.id === blockBasedProjectId);
      nextComponentIndex = currentComponentIndex + 1;
      if (!currentBlockBasedProject) {
        log('Not able to fetch CurrentTopicComponentInfo.currentBlockBasedProject in updateUserCurrentComponent method');
      }
      currentBlockBasedProjectId = get(currentBlockBasedProject, 'id');
      /*
      Checking whether user current topic status should be updated, below are the conditions:
      -user is hitting next and
      -current topic component should be 'blockBasedPractice'
      -called topic in input should be equal to current topic and
      -called blockBasedProject in input should be equal to current blockBasedProject
      Above conditions covers the case that current component status will only get changed, if
      called component is equal to  current component and user has just consumed(next action) it
      and current component status will not get changed when it is already consumed in past
      */
      if ((userAction === next || userAction === skip)
        // && currentTopicComponent === blockBasedPractice /** Temporarily removed to bypass check and eventually update to next component / topic */
        && currentTopicId === topicId
        && currentBlockBasedProjectId === blockBasedProjectId
      ) {
        updateUserCurrentTopicComponentStatus = true;
      }
      break;
    default:
  }

  if (nextComponentIndex < sortedTopicComponentRule.length) {
    nextCurrentTopicComponent = sortedTopicComponentRule && sortedTopicComponentRule.length > nextComponentIndex && sortedTopicComponentRule[nextComponentIndex];
  } else {
    const nextTopicRes = await callLocalGraphqlApi(getNextTopic(courseId, topicOrder));
    const nextTopic = get(nextTopicRes, 'data.topics[0]');
    const nextTopicComponentRule = get(nextTopic, 'topicComponentRule', []);
    const sortedNextTopicComponentRule = nextTopicComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
    nextCurrentTopicComponent = sortedNextTopicComponentRule && sortedNextTopicComponentRule.length && sortedNextTopicComponentRule[0];
    const nextTopicId = get(nextTopic, 'id', '');
    if (nextTopicId) {
      topicQuery = `currentTopicConnectId:"${nextTopicId}"`;
    }
  }

  if (nextCurrentTopicComponent.componentName) {
    if (nextCurrentTopicComponent.componentName === 'learningObjective') {
      const messageCount = get(nextCurrentTopicComponent, 'learningObjective.messagesMeta.count', 0);
      const pqCount = get(nextCurrentTopicComponent, 'learningObjective.questionBankMeta.count', 0);
      const comicStripCount = get(nextCurrentTopicComponent, 'learningObjective.comicStripsMeta.count', 0);
      const learningSlidesCount = get(nextCurrentTopicComponent, 'learningObjective.learningSlidesMeta.count', 0);
      if (messageCount) {
        nextCurrentTopicComponentType = message;
      } else if (pqCount) {
        nextCurrentTopicComponentType = practiceQuestion;
      } else if (comicStripCount) {
        nextCurrentTopicComponentType = comicStrip;
      } else if (learningSlidesCount) {
        nextCurrentTopicComponentType = learningSlide;
      }
    } else if ((nextCurrentTopicComponent.componentName === 'assignment') || (nextCurrentTopicComponent.componentName === 'homeworkAssignment') || (nextCurrentTopicComponent.componentName === 'homeworkPractice')) {
      nextCurrentTopicComponentType = quiz;
    } else {
      nextCurrentTopicComponentType = nextCurrentTopicComponent.componentName;
    }
  }

  if (nextCurrentTopicComponent.learningObjective && nextCurrentTopicComponent.learningObjective.id) {
    loQuery = `currentLearningObjectiveConnectId:"${nextCurrentTopicComponent.learningObjective.id}"`;
  }

  if (nextCurrentTopicComponent.video && nextCurrentTopicComponent.video.id) {
    videoQuery = `currentVideoConnectId:"${nextCurrentTopicComponent.video.id}"`;
  }

  if (nextCurrentTopicComponent.blockBasedProject && nextCurrentTopicComponent.blockBasedProject.id) {
    blockBasedProjectQuery = `currentBlockBasedProjectConnectId:"${nextCurrentTopicComponent.blockBasedProject.id}"`;
  }

  if (toUpdateLearningSlide && learningSlideId) {
    learningSlideQuery = `currentLearningSlideConnectId:"${learningSlideId}"`;
  } else if (get(nextCurrentTopicComponent, 'learningObjective.learningSlides[0].id')) {
    // while switching to next topic
    learningSlideQuery = `currentLearningSlideConnectId:"${get(nextCurrentTopicComponent, 'learningObjective.learningSlides[0].id')}"`;
  }

  /*
  updating UserCurrentTopicComponentStatus based on flag updateUserCurrentTopicComponentStatus
  which becomes only true according to page and conditions above
  */
  if (updateUserCurrentTopicComponentStatus) {
    callLocalGraphqlApi(updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      loQuery,
      topicQuery,
      videoQuery,
      blockBasedProjectQuery,
      nextCurrentTopicComponentType,
      learningSlideQuery,
    ));
  } else if (toUpdateLearningSlide) {
    // when we are switching between internal learningSlides in LO then this will execute;
    callLocalGraphqlApi(updateUserCurrentTopicComponentStatusMutation(
      currentTopicComponentId,
      '',
      '',
      '',
      '',
      nextCurrentTopicComponentType,
      learningSlideQuery,
    ));
  }
  return true;
};

export default updateCurrentComponentStatusOfNewCourse;
