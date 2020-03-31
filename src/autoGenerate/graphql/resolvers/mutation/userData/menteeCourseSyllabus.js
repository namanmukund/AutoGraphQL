import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  slotTimes,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getSlotTimeFields = () => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += `${slotTime} `;
  });
  return slotTimeFields;
};

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
        chapters(
            filter: {
              status: ${PUBLISHED}
            }
          ){
          id
          title
          order
          topics(
            filter: {
              status: ${PUBLISHED}
            }
          ){
            id
            title
            order
            isTrial
            description
            thumbnail{
              id
              uri
              name
            }
          }
        }
      }
      currentTopic{
        id
        title
        description
        videoTitle
        order
        thumbnail{
          id
          name
          uri
        }
        description
        videoDescription
        videoThumbnail{
          id
          name
          uri
        }
      }
      currentLearningObjective{
        id
        title
        description
        thumbnail{
          id
          uri
          name
        }
      }
      currentTopicComponentType
      enrollmentType
    }
  }
  `;

// query to get chapters and topics belonging to a course
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
        chapters(
            filter: {
              status: ${PUBLISHED}
            }
          ){
          id
          title
          order
          topics(
            filter: {
              status: ${PUBLISHED}
            }
          ){
            id
            title
            order
            isTrial
            description
            thumbnail{
              id
              uri
              name
            }
          }
        }
      }
    }
  `;

// query to get mentee Sessions
const getMenteeSessions = (userId) => `
  query{
    menteeSessions(filter:{
      user_some:{
        id:"${userId}"
        }
    }){
      id
      topic{
        id
        title
        order
        thumbnail{
          id
          uri
          name
        }
        description
      }
      mentor{
        id
        email
        name
        socialProfilePic
      }
      bookingDate
      ${getSlotTimeFields()}
    }
  }
  `;

/*
This is called when mentee tries to load homepage
It will return all the booked and upcoming sessions based on User current topic component status
and sessions booked so far by a mentee which is in MenteeSession
It also returns the total no. of topics and chapters
*/
const menteeCourseSyllabusMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  let currentTopicComponentInfo;
  let menteeSessions;
  const upComingSession = [];
  const bookedSession = [];
  let lastTopicBookedOrder = 0;
  // if we get userId through token, then we will return syllabus for that user
  if (userId) {
    const res = await callLocalGraphqlApi(
      getUserCurrentTopicComponentStatus(userId),
      context,
      '',
    );
    currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
    // calling method to validate user current topic component status
    validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
    const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId));
    menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');
  /*
  If user is not logged in and asking for course syllabus then we will not add
  any document in Db and will return default data with first topic as unlocked
  */
  } else {
    const topic = await getFirstTopicAndLearningObjective('userCourseSyllabus');
    const firstTopic = get(topic, 'data.topics[0]');
    const firstLearningObjective = get(topic, 'data.topics[0].learningObjectives[0]');
    if (!firstTopic) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'FirstTopic is not present',
        },
      });
    }
    if (!firstLearningObjective) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'FirstTopicId.firstLearningObjective: is not present',
        },
      });
    }
    const courseResult = await callLocalGraphqlApi(getCourseQuery());
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python',
        },
      });
    }
    // constructing data when a not logged in user fetches userCourseSyllabus
    currentTopicComponentInfo = {
      currentCourse: course[0],
      currentTopic: firstTopic,
    };
  }

  const {
    currentCourse,
    currentTopic,
  } = currentTopicComponentInfo;

  // this object will be returned in output
  const currentUserSyllabus = {};
  let totalChapters = 0;
  let totalTopics = 0;
  const { chapters } = currentCourse;
  const { order: currentTopicOrder } = currentTopic;
  if (!chapters || !chapters.length) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentCourse.chapters: is not present',
      },
    });
  }

  // iterating over each of MenteeSessions to send sessions that are already booked and not yet completed by mentee
  if (menteeSessions && menteeSessions.length) {
    menteeSessions.forEach((menteeSession) => {
      let slotTime = null;
      const {
        bookingDate,
      } = menteeSession;
      const {
        order: topicOrder,
        id: topicId,
        title: topicTitle,
        description: topicDescription,
        thumbnail: topicThumbnail,
      } = menteeSession.topic;

      // setting last topic booked order, will use this to find upcoming sessions
      if (topicOrder > lastTopicBookedOrder) {
        lastTopicBookedOrder = topicOrder;
      }
      const {
        id: mentorId,
        name: mentorName,
        socialProfilePic: mentorProfilePic,
      } = menteeSession.mentor;

      slotTimes.forEach((time, index) => {
        if (menteeSession[time]) {
          slotTime = index;
        }
      });
      // checking logic if topic is already consumed or yet to be watched
      if (
        topicOrder <= currentTopicOrder
      ) {
        const bookedMenteeSession = {
          topicId,
          topicOrder,
          topicTitle,
          topicThumbnail,
          topicDescription,
          bookingDate,
          slotTime,
          mentorId,
          mentorName,
          mentorProfilePic,
        };
        bookedSession.push(bookedMenteeSession);
      }
    });
  }


  totalChapters += chapters.length;
  // iterating over chapters to construct data for homepage
  chapters.forEach((chapter) => {
    if (!chapter || !chapter.topics || !chapter.topics.length) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'CurrentCourse.chapter.topics: is not present',
        },
      });
    }
    totalTopics += chapter.topics.length;
    // iterating over topics of each chapter  and setting isUnlocked field
    chapter.topics.forEach((topic) => {
      const {
        order: topicOrder,
        id: topicId,
        title: topicTitle,
        description: topicDescription,
        thumbnail: topicThumbnail,
      } = topic;
      // checking logic for topics which are yet not booked by mentee
      if (
        topicOrder > lastTopicBookedOrder
      ) {
        const upComingMenteeSession = {
          topicId,
          topicOrder,
          topicTitle,
          topicThumbnail,
          topicDescription,
        };
        upComingSession.push(upComingMenteeSession);
      }
    });
  });
  Object.assign(currentUserSyllabus, {
    upComingSession,
    bookedSession,
    totalChapters,
    totalTopics,
  });

  return currentUserSyllabus;
};

export default menteeCourseSyllabusMutationResolver;
