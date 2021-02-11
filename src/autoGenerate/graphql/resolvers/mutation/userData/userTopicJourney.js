import { get, cloneDeep } from 'lodash';
import {
  topicTypes,
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  enrollmentTypes, masteryLevels, userTopicTypeStatus, sessionStatus, batchType,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError, UnauthenticatedUserError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import { log } from '../../../../../../utils';
import getMasteryLevel from '../../utils/getMasteryLevel';
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

// query to get chapters and topics belomngin to a course
const getTopicQuery = (topicId) => `
  query{
    topic(id:"${topicId}"){
      id
      order
      isTrial
      title
      description
      thumbnail{
        id
        uri
        type
      }
      videoTitle
      videoDescription
      videoThumbnail{
        id
        uri
        type
      }
      learningObjectives(filter:{
        status: ${PUBLISHED}
        }
        orderBy: order_ASC
      ){
        id
        order
        title
        description
        thumbnail{
          id
          uri
          type
        }
      }
    }
  }
  `;

// query to get first user quiz report of a topic
const getQuizReportQuery = (userId, topicId) => `
  query{
    userQuizReports(
      filter:{
      and:[
        {
          user_some:{
            id: "${userId}"
          }
        },
        {
          topic_some:{
            id:"${topicId}"
          }
        }
      ]
    }
    orderBy: createdAt_DESC
    first: 1
  ){
      id
      quizReport{
        totalQuestionCount
        correctQuestionCount
      }
    }
  }
  `;

// query to get UserLeaaarningObjective of a user and LO
const getUserLearningObjectiveQuery = (userId, learningObjectiveId) => `
  query{
    userLearningObjectives(filter:{
      and:[
        {user_some:{
            id: "${userId}"
          }},
        {learningObjective_some:{
            id: "${learningObjectiveId}"
          }}
      ]
    }){
      id
      practiceQuestionStatus
      chatStatus
    }
  }
  `;

// query to get batch Sessions
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

const getUpdatedLearningObjectivesData = async (userId, learningObjectivesData, context) => {
  const clonedLearningObjectivesData = cloneDeep(learningObjectivesData);
  /* eslint no-restricted-syntax:0 */
  for (const loInArray of clonedLearningObjectivesData) {
    loInArray.isUnlocked = true;
    /* eslint no-await-in-loop:0 */
    const userLearningObjectiveRes = await callLocalGraphqlApi(
      getUserLearningObjectiveQuery(userId, loInArray.id),
      context,
      '',
    );
    const userLearningObjectiveInfo = get(userLearningObjectiveRes, 'data.userLearningObjectives[0]');
    if (userLearningObjectiveInfo) {
      loInArray.practiceQuestionStatus = userLearningObjectiveInfo.practiceQuestionStatus;
      loInArray.chatStatus = userLearningObjectiveInfo.chatStatus;
    }
  }
  return clonedLearningObjectivesData;
};

/*
This is called when user tries to load journey page
It will return all the components of a topics(video, LO, quiz)
in their locked/unlocked status based on User current topic component status
It also returns the mastery level of user quiz
*/
const userTopicJourneyMutationResolver = async (
  root,
  input,
  typeName,
  info,
  mutationName,
  ast,
  context,
  params,
) => {
  /*
  Calling method to validate token and return userId.
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  const { topicId } = params;
  if (!topicId) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'topicId is not present',
      },
    });
  }

  if (!userId) {
    throw new UnauthenticatedUserError();
  }

  const res = await callLocalGraphqlApi(
    getUserCurrentTopicComponentStatus(userId),
    context,
    '',
  );

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
  const batchCurrentComponentBatchType = get(batchRes, 'data.user.studentProfile.batch.type');

  // calling API to get data of fetched topic
  const topicRes = await callLocalGraphqlApi(
    getTopicQuery(topicId),
    context,
    '',
  );
  // getting info of called topic
  const topicInfo = get(topicRes, 'data.topic');
  if (!topicInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'Topic is not present',
      },
    });
  }
  const {
    currentTopicComponentType: currentTopicComponent,
    currentTopic: currentRunningTopic,
    currentLearningObjective: currentRunningLearningObjective,
    enrollmentType,
  } = currentTopicComponentInfo;
  // this object will be returned in output
  const userTopicData = {};
  const { incomplete, complete } = userTopicTypeStatus;
  // constructing data for video component
  const videoData = {
    title: topicInfo.videoTitle,
    description: topicInfo.videoDescription,
    thumbnail: topicInfo.videoThumbnail,
  };
  // constructing data for LO component
  let learningObjectivesData = [];
  topicInfo.learningObjectives.forEach((loInArray) => {
    const {
      id,
      title,
      order,
      description,
      thumbnail,
    } = loInArray;
    learningObjectivesData.push({
      id,
      title,
      order,
      description,
      thumbnail,
      practiceQuestionStatus: incomplete,
      chatStatus: incomplete,
    });
  });
  // constructing data for quiz component
  const quizData = {
    title: topicInfo.title,
    description: topicInfo.description,
    thumbnail: topicInfo.thumbnail,
    status: incomplete,
  };
  const { pro } = enrollmentTypes;
  /*
  Logic for getting locked status of different components for a topic
  if called topic order is less than that of current topic order,
   that means all components are unlocked for that topic
   topicInfo - this is topic requested by user in API
   currentRunningTopic - this is topic in UserCurrentTopicComponentStatus
  */
  const { defaultMastery } = masteryLevels;
  let topicStatus = incomplete;
  let currentRunningTopicOrder;
  // for batches we will use batchCurrentComponentStatus to check current topic
  if (batchCurrentComponentInfo) {
    const {
      currentTopic: currentBatchRunningTopic,
    } = batchCurrentComponentInfo;
    currentRunningTopicOrder = currentBatchRunningTopic && currentBatchRunningTopic.order;
  } else {
    currentRunningTopicOrder = currentRunningTopic.order;
  }

  if (topicInfo.order < currentRunningTopicOrder) {
    if (topicInfo.isTrial || enrollmentType === pro) {
      videoData.isUnlocked = true;
    } else {
      videoData.isUnlocked = false;
    }
    learningObjectivesData = getUpdatedLearningObjectivesData(userId, learningObjectivesData, context);

    quizData.isUnlocked = true;
    // getting user quiz report to get the mastery level of user in quiz
    const quizRes = await callLocalGraphqlApi(
      getQuizReportQuery(userId, topicId),
      context,
      '',
    );
    const quizInfo = get(quizRes, 'data.userQuizReports[0]');
    if (!quizInfo) {
      log('Topic quiz report is not present');
    }
    let correctQuestionCount = 0;
    let totalQuestionCount = 0;
    if (quizInfo && quizInfo.quizReport) {
      correctQuestionCount = quizInfo.quizReport.correctQuestionCount;
      totalQuestionCount = quizInfo.quizReport.totalQuestionCount;
    }
    // logic to calculate mastery level on basis of percentage
    const masteryLevel = getMasteryLevel(correctQuestionCount, totalQuestionCount);
    quizData.masteryLevel = masteryLevel;
    topicStatus = complete;
    quizData.status = complete;
    /*
    if called topic order is greater than that of current topic order,
     that means all components are locked for that topic
    */
  } else if (topicInfo.order > currentRunningTopicOrder) {
    videoData.isUnlocked = false;
    learningObjectivesData.forEach((loInArray, index) => {
      learningObjectivesData[index].isUnlocked = false;
    });
    quizData.isUnlocked = false;
    quizData.masteryLevel = defaultMastery;
    /*
    if called topic order is equal to than that of current topic order,
     In that case we will check currentTopicComponent and will get locked/unlocked
     status on basis of that
    */
  } else {
    // batch user calculation when topic order === current topi order in batch
    /* eslint no-lonely-if:0 */
    if (batchCurrentComponentInfo) {
      const {
        latestSessionStatus,
      } = batchCurrentComponentInfo;
      if (latestSessionStatus === sessionStatus.started || latestSessionStatus === sessionStatus.completed) {
        if (topicInfo.isTrial || enrollmentType === pro) {
          videoData.isUnlocked = true;
        } else {
          videoData.isUnlocked = false;
        }

        learningObjectivesData = getUpdatedLearningObjectivesData(userId, learningObjectivesData, context);

        quizData.isUnlocked = true;
        // getting user quiz report to get the mastery level of user in quiz
        const quizRes = await callLocalGraphqlApi(
          getQuizReportQuery(userId, topicId),
          context,
          '',
        );
        const quizInfo = get(quizRes, 'data.userQuizReports[0]');
        if (!quizInfo) {
          log('Topic quiz report is not present');
        }
        let correctQuestionCount = 0;
        let totalQuestionCount = 0;
        if (quizInfo && quizInfo.quizReport) {
          correctQuestionCount = quizInfo.quizReport.correctQuestionCount;
          totalQuestionCount = quizInfo.quizReport.totalQuestionCount;
        }
        // logic to calculate mastery level on basis of percentage
        const masteryLevel = getMasteryLevel(correctQuestionCount, totalQuestionCount);
        quizData.masteryLevel = masteryLevel;
        topicStatus = complete;
        quizData.status = complete;
      }
    } else {
      const { video, quiz } = topicTypes;
      quizData.masteryLevel = defaultMastery;
      // video is unlocked only if topic is free or user is pro
      if (topicInfo.isTrial || enrollmentType === pro) {
        videoData.isUnlocked = true;
      } else {
        videoData.isUnlocked = false;
      }
      switch (currentTopicComponent) {
        // since video is first component, if that is current topic component
        // that means all components are locked
        case video: {
          learningObjectivesData.forEach((loInArray, index) => {
            learningObjectivesData[index].isUnlocked = false;
          });
          quizData.isUnlocked = false;
          break;
        }
        // since quiz is last component, if that is current topic component
        // that means all components are unlocked
        case quiz: {
          learningObjectivesData = getUpdatedLearningObjectivesData(userId, learningObjectivesData, context);
          quizData.isUnlocked = true;
          break;
        }
        default: {
          // case when messgae or practiceQuestion is current component
          // in that case we are checking order of LOs
          learningObjectivesData.forEach((loInArray, index) => {
            if (loInArray.order <= currentRunningLearningObjective.order) {
              learningObjectivesData[index].isUnlocked = true;
            } else {
              learningObjectivesData[index].isUnlocked = false;
            }
          });
          for (const loInArray of learningObjectivesData) {
            if (loInArray.order <= currentRunningLearningObjective.order) {
              loInArray.isUnlocked = true;
              /* eslint no-await-in-loop:0 */
              const userLearningObjectiveRes = await callLocalGraphqlApi(
                getUserLearningObjectiveQuery(userId, loInArray.id),
                context,
                '',
              );
              const userLearningObjectiveInfo = get(userLearningObjectiveRes, 'data.userLearningObjectives[0]');
              if (userLearningObjectiveInfo) {
                loInArray.practiceQuestionStatus = userLearningObjectiveInfo.practiceQuestionStatus;
                loInArray.chatStatus = userLearningObjectiveInfo.chatStatus;
              }
            } else {
              loInArray.isUnlocked = false;
            }
          }
          quizData.isUnlocked = false;
          break;
        }
      }
    }
  }
  // Constructing data as per schema
  Object.assign(userTopicData, {
    video: videoData,
    learningObjectives: learningObjectivesData,
    quiz: quizData,
    topicStatus,
  });
  return userTopicData;
};

export default userTopicJourneyMutationResolver;
