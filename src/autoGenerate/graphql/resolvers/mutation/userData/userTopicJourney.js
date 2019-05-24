import { get } from 'lodash';
import {
  topicTypes,
  GLOBAL_COURSE_ID,
  PUBLISHED,
  enrollmentTypes, scholarshipThreshHolds, masteryLevels,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import callGraphqlApi from '../../../../../api/callGraphqlApi';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';

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
          {id:"${GLOBAL_COURSE_ID}"}
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
const getTopicQuery = topicId => `
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
  const { pro } = enrollmentTypes;
  const { video, quiz } = topicTypes;
  const { proficient: proficientPercent, master: masterPercent, familiar: familiarPercent }
  = scholarshipThreshHolds;
  const { proficient, master, familiar } = masteryLevels;
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
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'userId is not present',
      },
    });
  }

  const { authorization: token } = context;
  const res = await callGraphqlApi(
    getUserCurrentTopicComponentStatus(userId),
    '',
    '',
    '',
    token,
  );

  const currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
  /*
    This case should not occur as we have added logic in prehook userTopicJourneyMethod
    to add userCurrentTopicComponentStatus if it not already present and
    the first published topic and first published learning objective corresponding to that topic
    will get populated in the document
    */
  if (!currentTopicComponentInfo) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'UserCurrentTopicComponentStatus: is not present',
      },
    });
  }
  // calling API to get data of fetched topic
  const topicRes = await callGraphqlApi(
    getTopicQuery(topicId),
    '',
    '',
    '',
    token,
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
    currentTopic,
    currentLearningObjective,
    enrollmentType,
  } = currentTopicComponentInfo;
  // throwing errors if some data is missing in User current topic component status
  if (!currentTopicComponent) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopicComponent: is not present',
      },
    });
  }
  if (!currentTopic) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentTopic: is not present',
      },
    });
  }
  if (!currentLearningObjective) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentLearningObjective: is not present',
      },
    });
  }
  if (!enrollmentType) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'EnrollmentType: is not present',
      },
    });
  }
  // this object will be returned in output
  const userTopicData = {};
  // constructing data for video component
  const videoData = {
    id: topicInfo.id,
    title: topicInfo.videoTitle,
    description: topicInfo.videoDescription,
    thumbnail: topicInfo.videoThumbnail,
  };
  // constructing data for LO component
  const learningObjectivesData = [];
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
    });
  });
  // constructing data for quiz component
  const quizData = {
    id: topicInfo.id,
    title: topicInfo.title,
    description: topicInfo.description,
    thumbnail: topicInfo.thumbnail,
  };

  /*
  Logic for getting locked status of different components for a topic
  if called topic order is less than that of current topic order,
   that means all components are unlocked for that topic
  */
  if (topicInfo.order < currentTopic.order) {
    videoData.isUnlocked = true;
    learningObjectivesData.forEach((loInArray, index) => {
      learningObjectivesData[index].isUnlocked = true;
    });
    quizData.isUnlocked = true;
    // getting user quiz report to get the mastery level of user in quiz
    const quizRes = await callGraphqlApi(
      getQuizReportQuery(userId, topicId),
      '',
      '',
      '',
      token,
    );
    const quizInfo = get(quizRes, 'data.userQuizReports[0]');
    if (!quizInfo) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Topic quiz report is not present',
        },
      });
    }
    // logic to calculate mastery level on basis of percentage
    let percentage = 0;
    if (quizInfo.quizReport) {
      percentage =
        (quizInfo.quizReport.correctQuestionCount / quizInfo.quizReport.totalQuestionCount) * 100;
    }
    if (percentage === proficientPercent) {
      quizData.masteryLevel = proficient;
    } else if (percentage >= masterPercent) {
      quizData.masteryLevel = master;
    } else if (percentage >= familiarPercent) {
      quizData.masteryLevel = familiar;
    } else {
      quizData.masteryLevel = 'none';
    }
    /*
    if called topic order is greater than that of current topic order,
     that means all components are locked for that topic
    */
  } else if (topicInfo.order > currentTopic.order) {
    videoData.isUnlocked = false;
    learningObjectivesData.forEach((loInArray, index) => {
      learningObjectivesData[index].isUnlocked = false;
    });
    quizData.isUnlocked = false;
    quizData.masteryLevel = 'none';
    /*
    if called topic order is equal to than that of current topic order,
     In that case we will check currentTopicComponent and will get locked/unlocked
     status on basis of that
    */
  } else {
    quizData.masteryLevel = 'none';
    // components are unlocked only if topic is free or user is pro
    if (topicInfo.isTrial || enrollmentType === pro) {
      // video will always be unlocked since it is first component of topic
      videoData.isUnlocked = true;
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
          learningObjectivesData.forEach((loInArray, index) => {
            learningObjectivesData[index].isUnlocked = true;
          });
          quizData.isUnlocked = true;
          break;
        }
        default: {
          // case when messgae or practiceQuestion is current component
          // in that case we are checking order of LOs
          learningObjectivesData.forEach((loInArray, index) => {
            if (loInArray.order <= currentLearningObjective.order) {
              learningObjectivesData[index].isUnlocked = true;
            } else {
              learningObjectivesData[index].isUnlocked = false;
            }
          });
          quizData.isUnlocked = false;
          break;
        }
      }
    } else {
      videoData.isUnlocked = false;
      learningObjectivesData.forEach((loInArray, index) => {
        learningObjectivesData[index].isUnlocked = false;
      });
      quizData.isUnlocked = false;
    }
  }
  // Constructing data as per schema
  Object.assign(userTopicData, {
    video: videoData,
    learningObjectives: learningObjectivesData,
    quiz: quizData,
  });

  return userTopicData;
};

export default userTopicJourneyMutationResolver;
