import { get } from 'lodash';
import {
  enrollmentTypes,
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
  slotTimes,
  sessionStatus, badgeTypes, blockBasedProjectType,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation
  from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { parseBadges } from '../utils/parseBadges';
import { sortBadges } from '../utils/sortBadges';

const getSlotTimeFields = () => {
  let slotTimeFields = '';
  slotTimes.forEach((slotTime) => {
    slotTimeFields += `${slotTime} `;
  });
  return slotTimeFields;
};

// calculate if user can consume a topic or not
const isTopicAccessible = (enrollmentType, isTopicFree) => {
  if (enrollmentType === enrollmentTypes.pro) {
    return true;
  }
  if (isTopicFree) {
    return true;
  }
  return false;
};

// return mentor object in the defined format
const getMentorData = (allottedMentor) => {
  const { name, profilePic, mentorProfile } = allottedMentor;
  const mentor = { name, profilePic };
  if (mentorProfile) {
    const {
      description,
      linkedInLink,
      portfolioLink,
      gitHubLink,
      experienceYear,
      pythonCourseRating5,
      pythonCourseRating4,
      pythonCourseRating3,
      pythonCourseRating2,
      pythonCourseRating1,
    } = mentorProfile;
    mentor.experienceYear = experienceYear;
    mentor.description = description;
    mentor.linkedInLink = linkedInLink;
    mentor.portfolioLink = portfolioLink;
    mentor.gitHubLink = gitHubLink;
    let totalRatingUsers = 0;
    let cumulativeRating = 0;
    if (pythonCourseRating5) {
      totalRatingUsers += pythonCourseRating5;
      cumulativeRating += pythonCourseRating5 * 5;
    }
    if (pythonCourseRating4) {
      totalRatingUsers += pythonCourseRating4;
      cumulativeRating += pythonCourseRating4 * 4;
    }
    if (pythonCourseRating3) {
      totalRatingUsers += pythonCourseRating3;
      cumulativeRating += pythonCourseRating3 * 3;
    }
    if (pythonCourseRating2) {
      totalRatingUsers += pythonCourseRating2;
      cumulativeRating += pythonCourseRating2 * 2;
    }
    if (pythonCourseRating1) {
      totalRatingUsers += pythonCourseRating1;
      cumulativeRating += pythonCourseRating1;
    }
    mentor.averageRating = totalRatingUsers ? Math.round(((cumulativeRating.length * 100) / totalRatingUsers) * 100) / 100 : 0;
  }
  return mentor;
};

// query to get current component status of user
const getUserCurrentTopicComponentStatus = (userId, courseId) => `
  query{
    userCurrentTopicComponentStatuses(filter:{
      and:[
        {user_some:{
        id:"${userId}"
        }},
        {currentCourse_some:{
          ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
        }}
      ]
    }){
      id
      currentCourse{
        id
        title
        description
        badgeDescription
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
            thumbnailSmall{
              id
              uri
              name
            }
            projectCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.project}}{status: ${PUBLISHED} }]}){
              count
            }
            practiceCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.practice}}{status: ${PUBLISHED}}]}){
              count
            }
            projects: blockBasedProjects(filter:{and:[{type: ${blockBasedProjectType.project}} {status: ${PUBLISHED}}]}){
              id
              title
              projectThumbnail{
                id
              }
              tags{
                title
              }
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
        thumbnailSmall{
          id
          uri
          name
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
const getCourseQuery = (courseId) => `
    query{
      courses(filter:{
        ${courseId ? `id: "${courseId}"` : `and:[{title: "${GLOBAL_COURSE_TITLE}"}, {status: ${PUBLISHED}}]`}
      }){
        id
        title
        description
        badgeDescription
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
            isTrial
            thumbnail{
              id
              uri
              name
            }
            thumbnailSmall{
              id
              uri
              name
            }
            projectCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.project}}{status: ${PUBLISHED} }]}){
              count
            }
            practiceCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.practice}}{status: ${PUBLISHED}}]}){
              count
            }
            projects: blockBasedProjects(filter:{and:[{type: ${blockBasedProjectType.project}} {status: ${PUBLISHED}}]}){
              id
              title
              projectThumbnail{
                id
                name
                uri
              }
              tags{
                id
                title
              }
            }
          }
        }
      }
    }
  `;

// query to get mentee Sessions
const getMenteeSessions = (userId, courseId) => `
query{
  menteeSessions(filter:{
    and:[
      {
      user_some:{
        id:"${userId}"
        }
      }
      ${courseId ? `{course_some:{id: "${courseId}"}}` : ''}
    ]
    }){
      id
      topic{
        id
        title
        order
        isTrial
        chapter{
          id
          title
          order
        }
        thumbnail{
          id
          uri
          name
        }
        thumbnailSmall{
          id
          uri
          name
        }
        description
      }
      bookingDate
      ${getSlotTimeFields()}
    }
  }
  `;

// query to get mentorMentee Sessions
const getMentorMenteeSessions = (userId, courseId) => `
  query{
    mentorMenteeSessions(filter:{
      and:[
        {
          menteeSession_some:{
            user_some:{
              id:"${userId}"
            }
          }
        }
        {
          sessionStatus: completed
        }
        ${courseId ? `{course_some:{id: "${courseId}"}}` : ''}
      ]
    }){
      id
      topic{
        id
        title
        order
        chapter{
          id
          title
          order
        }
        thumbnail{
          id
          uri
          name
        }
        thumbnailSmall{
          id
          uri
          name
        }
        description
      }
      sessionEndDate
      sessionStatus
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
          allottedMentor{
            name
            profilePic{
              id
              uri
              name
            }
            mentorProfile{
              description
              pythonCourseRating5
              pythonCourseRating4
              pythonCourseRating3
              pythonCourseRating2
              pythonCourseRating1
              gitHubLink
              linkedInLink
              portfolioLink
              experienceYear
            }
          }
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

// query to get batch Sessions
// query to get batch Sessions
const getBatchSessions = (batchId, courseId) => `
  query{
    batchSessions(filter:{
    and: [
      {
        batch_some:{
          id:"${batchId}"
        }
      }
      ${courseId ? `{course_some:{id: "${courseId}"}}` : ''}
    ]
    }){
      id
      topic{
        id
        title
        order
        isTrial
        thumbnail{
          id
          uri
          name
        }
        thumbnailSmall{
          id
          uri
          name
        }
        description
      }
      bookingDate
      ${getSlotTimeFields()}
    }
  }
  `;

// query to get all badges in a course along with the topic
const getBadgeQuery = (courseId) => `
query{
  badges(
    filter:{
      and:[
        {
          status:${PUBLISHED}
        }
        {
          courses_some:{
            ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
          }
        }
        {
          type: ${badgeTypes.skill}
        }
      ]
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

// query to get mentor from salesOperation
const getAllottedMentorQuery = (userId, courseId) => `
  query{
    salesOperations(filter:{
          and:[
        {
          client_some:{
            id:"${userId}"
          }
        }
        ${courseId ? `{course_some:{
          ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
        }}` : ''}
      ]
    }){
      allottedMentor{
        name
        profilePic{
          id
          uri
          name
        }
        mentorProfile{
          description
          pythonCourseRating5
          pythonCourseRating4
          pythonCourseRating3
          pythonCourseRating2
          pythonCourseRating1
          gitHubLink
          linkedInLink
          portfolioLink
          experienceYear
        }
      }
    }
  }
  `;

// query to get mentor from MMS
const allottedMentorFromMMSQuery = (userId, courseId) => `
  query{
    mentorMenteeSessions(filter:{
      and:[
        {
          menteeSession_some:{
            user_some:{
              id: "${userId}"
            }
          }
        }
        ${courseId ? `{course_some:{
          ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
        }}` : ''}
      ]
    }){
      mentorSession{
        user{
          name
          profilePic{
            id
            uri
            name
          }
          mentorProfile{
            description
            pythonCourseRating5
            pythonCourseRating4
            pythonCourseRating3
            pythonCourseRating2
            pythonCourseRating1
            gitHubLink
            linkedInLink
            portfolioLink
            experienceYear
          }
        }
      }
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
  const { courseId } = params;
  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  let batchCurrentComponentInfo;
  let currentTopicComponentInfo;
  let menteeSessions;
  let mentorMenteeSessions;
  let batchSessions;
  const upComingSession = [];
  const bookedSession = [];
  const completedSession = [];
  let lastTopicBookedOrder = 0;
  let lastCompletedTopicOrder = 0;
  let isPaid = false;
  let currentTopicOrder;
  let projectCount = 0;
  let practiceCount = 0;
  const projects = [];
  let mentorData = {};
  // if we get userId through token, then we will return syllabus for that user
  if (userId) {
    // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
    const batchRes = await callLocalGraphqlApi(
      getBatchStatus(userId),
      context,
      '',
    );

    const batchCurrentComponentCourseId = get(batchRes, 'data.user.studentProfile.batch.currentComponent.currentCourse.id');

    if (batchCurrentComponentCourseId === courseId) {
      batchCurrentComponentInfo = get(batchRes, 'data.user.studentProfile.batch.currentComponent');
      const allottedMentor = get(batchRes, 'data.user.studentProfile.batch.currentComponent.allottedMentor');
      if (allottedMentor && allottedMentor.name) {
        mentorData = getMentorData(allottedMentor);
      }
    }

    const res = await callLocalGraphqlApi(
      getUserCurrentTopicComponentStatus(userId, courseId),
      context,
      '',
    );
    currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
    // calling method to validate user current topic component status
    validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

    // menteeSessions and mentorMenteeSessions will be called if user is not from batch
    if (batchCurrentComponentInfo) {
      const batchId = get(batchRes, 'data.user.studentProfile.batch.id');
      const getBatchSessionsRes = await callLocalGraphqlApi(getBatchSessions(batchId, courseId));
      batchSessions = get(getBatchSessionsRes, 'data.batchSessions');
      currentTopicOrder = get(batchCurrentComponentInfo, 'currentTopic.order');
    } else {
      const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, courseId));
      menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');

      const getMentorMenteeSessionsRes = await callLocalGraphqlApi(getMentorMenteeSessions(userId, courseId));
      mentorMenteeSessions = get(getMentorMenteeSessionsRes, 'data.mentorMenteeSessions');
      currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');

      if (mentorMenteeSessions && mentorMenteeSessions.length) {
        const allottedMentorQueryRes = await callLocalGraphqlApi(getAllottedMentorQuery(userId, courseId));
        const allottedMentor = get(allottedMentorQueryRes, 'data.salesOperations[0].allottedMentor', '');
        if (allottedMentor && allottedMentor.name) {
          mentorData = getMentorData(allottedMentor);
        }
      }

      if (!mentorData.name) {
        const allottedMentorFromMMSQueryRes = await callLocalGraphqlApi(allottedMentorFromMMSQuery(userId, courseId));
        const allottedMentor = get(allottedMentorFromMMSQueryRes, 'data.mentorMenteeSessions[0].mentorSession.user');
        if (allottedMentor && allottedMentor.name) {
          mentorData = getMentorData(allottedMentor);
        }
      }
    }
  /*
  If user is not logged in and asking for course syllabus then we will not add
  any document in Db and will return default data with first topic as unlocked
  */
  } else {
    const topic = await getFirstTopicAndLearningObjective('userCourseSyllabus', courseId);
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
    const courseResult = await callLocalGraphqlApi(getCourseQuery(courseId));
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
      enrollmentType: enrollmentTypes.free,
    };
    // Setting topic order as -1 and currentTopicComponentType as video for guest user,
    // this way all inactive images will be returned
    currentTopicOrder = -1;
  }

  const {
    currentCourse,
    enrollmentType,
  } = currentTopicComponentInfo;

  // this object will be returned in output
  const currentUserSyllabus = {};
  let totalChapters = 0;
  let totalTopics = 0;
  const { chapters } = currentCourse;
  if (!chapters || !chapters.length) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentCourse.chapters: is not present',
      },
    });
  }
  // if user belongs to a batch, the syllbaus will be calculated on basis of batchCurrentComponentStatus
  if (batchCurrentComponentInfo) {
    const {
      currentTopic,
      latestSessionStatus,
    } = batchCurrentComponentInfo;

    lastTopicBookedOrder = currentTopic && currentTopic.order;
    const lastTopicSessionStatus = latestSessionStatus;

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
        const { id: chapterId, title: chapterTitle, order: chapterOrder } = chapter;
        if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
        if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
        if (topic.projects && topic.projects.length) {
          topic.projects.forEach((project) => {
            projects.push(project);
          });
        }

        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          isTrial,
        } = topic;

        const isAccessible = isTopicAccessible(enrollmentType, isTrial);
        // checking logic for topics which are yet not booked by mentee
        if (
          topicOrder > lastTopicBookedOrder
        ) {
          const upComingMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            isAccessible,
            chapterId,
            chapterTitle,
            chapterOrder,
          };
          upComingSession.push(upComingMenteeSession);
        } else if (topicOrder === lastTopicBookedOrder) {
          if (lastTopicSessionStatus === sessionStatus.completed) {
            const completedMenteeSession = {
              topicId,
              topicOrder,
              topicTitle,
              topicThumbnail,
              topicThumbnailSmall,
              topicDescription,
              isAccessible,
              chapterId,
              chapterTitle,
              chapterOrder,
            };
            completedSession.push(completedMenteeSession);
          } else {
            // iterating over each of batchSessions to send sessions that are already booked and not yet completed by mentee
            if (batchSessions && batchSessions.length) {
              batchSessions.forEach((batchSession) => {
                let slotTime = null;
                const {
                  bookingDate,
                } = batchSession;
                const {
                  order: batchSessionTopicOrder,
                  id: batchSessionTopicId,
                  title: batchSessionTopicTitle,
                  description: batchSessionTopicDescription,
                  thumbnail: batchSessionTopicThumbnail,
                  thumbnailSmall: batchSessionTopicThumbnailSmall,
                  isTrial: batchSessionIsTrial,
                } = batchSession.topic;

                const isBatchTopicAccessible = isTopicAccessible(enrollmentType, batchSessionIsTrial);

                slotTimes.forEach((time, index) => {
                  if (batchSession[time]) {
                    slotTime = index;
                  }
                });
                // checking logic if topic is already consumed or yet to be watched
                if (
                  batchSessionTopicOrder === lastTopicBookedOrder
                ) {
                  const bookedMenteeSession = {
                    topicId: batchSessionTopicId,
                    topicOrder: batchSessionTopicOrder,
                    topicTitle: batchSessionTopicTitle,
                    topicThumbnail: batchSessionTopicThumbnail,
                    topicThumbnailSmall: batchSessionTopicThumbnailSmall,
                    topicDescription: batchSessionTopicDescription,
                    bookingDate,
                    slotTime,
                    isAccessible: isBatchTopicAccessible,
                    chapterId,
                    chapterTitle,
                    chapterOrder,
                  };
                  bookedSession.push(bookedMenteeSession);
                }
              });
            }

            if (bookedSession && !bookedSession.length) {
              const upComingMenteeSession = {
                topicId,
                topicOrder,
                topicTitle,
                topicThumbnail,
                topicThumbnailSmall,
                topicDescription,
                isAccessible,
                chapterId,
                chapterTitle,
                chapterOrder,
              };
              upComingSession.push(upComingMenteeSession);
            }
          }
        } else {
          const completedMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            isAccessible,
            chapterId,
            chapterTitle,
            chapterOrder,
          };
          completedSession.push(completedMenteeSession);
        }
      });
    });
  } else {
    // iterating over each of mentorMenteeSessions to send sessions that are already completed by mentee
    if (mentorMenteeSessions && mentorMenteeSessions.length) {
      mentorMenteeSessions.forEach((mentorMenteeSession) => {
        const {
          sessionEndDate: endingDate,
        } = mentorMenteeSession;
        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          chapter,
        } = mentorMenteeSession.topic;

        // setting last topic completed order, will use this to find booked sessions that are not completed
        if (topicOrder > lastCompletedTopicOrder) {
          lastCompletedTopicOrder = topicOrder;
        }

        const completedMenteeSession = {
          topicId,
          topicOrder,
          topicTitle,
          topicThumbnail,
          topicThumbnailSmall,
          topicDescription,
          endingDate,
          chapterId: chapter && chapter.id,
          chapterTitle: chapter && chapter.title,
          chapterOrder: chapter && chapter.order,
        };
        completedSession.push(completedMenteeSession);
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
          thumbnailSmall: topicThumbnailSmall,
          isTrial,
          chapter,
        } = menteeSession.topic;

        const isAccessible = isTopicAccessible(enrollmentType, isTrial);

        // setting last topic booked order, will use this to find upcoming sessions
        if (topicOrder > lastTopicBookedOrder) {
          lastTopicBookedOrder = topicOrder;
        }

        slotTimes.forEach((time, index) => {
          if (menteeSession[time]) {
            slotTime = index;
          }
        });
        // checking logic if topic is already consumed or yet to be watched
        if (
          topicOrder > lastCompletedTopicOrder
        ) {
          const bookedMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            bookingDate,
            slotTime,
            isAccessible,
            chapterId: chapter && chapter.id,
            chapterTitle: chapter && chapter.title,
            chapterOrder: chapter && chapter.order,
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
        const { id: chapterId, title: chapterTitle, order: chapterOrder } = chapter;
        if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
        if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
        if (topic.projects && topic.projects.length) {
          topic.projects.forEach((project) => {
            projects.push(project);
          });
        }
        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          isTrial,
        } = topic;

        const isAccessible = isTopicAccessible(enrollmentType, isTrial);
        // checking logic for topics which are yet not booked by mentee
        if (
          topicOrder > lastTopicBookedOrder
        ) {
          const upComingMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            isAccessible,
            chapterId,
            chapterTitle,
            chapterOrder,
          };
          upComingSession.push(upComingMenteeSession);
        }
      });
    });
  }

  if (enrollmentType === enrollmentTypes.pro) {
    isPaid = true;
  }

  // calling method to get all published badges
  const badgeRes = await callLocalGraphqlApi(getBadgeQuery(courseId));
  const skillsFromBadgeInfo = get(badgeRes, 'data.badges');
  skillsFromBadgeInfo.forEach((badge) => {
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
  });
  // sorting each badge array according to topic order
  skillsFromBadgeInfo.sort((a, b) => a.topic.order - b.topic.order);

  // getting parsed characters and equipments to be sent in result
  const skills = parseBadges(
    sortBadges(skillsFromBadgeInfo),
    currentTopicOrder,
  );

  const courseData = {
    title: currentCourse.title,
    description: currentCourse.description,
    badgeDescription: currentCourse.badgeDescription,
    chapterCount: totalChapters,
    topicCount: totalTopics,
    projectCount,
    practiceCount,
    courseCompletionPercentage: totalTopics ? Math.round(((completedSession.length * 100) / totalTopics) * 100) / 100 : 0,
  };

  Object.assign(currentUserSyllabus, {
    upComingSession,
    bookedSession,
    completedSession,
    totalChapters,
    totalTopics,
    isPaid,
    skills,
    course: courseData,
    projects,
    mentor: mentorData,
  });

  return currentUserSyllabus;
};

export default menteeCourseSyllabusMutationResolver;
