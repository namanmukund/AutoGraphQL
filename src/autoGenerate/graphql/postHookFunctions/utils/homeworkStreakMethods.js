import { GLOBAL_COURSE_TITLE, OLD_COURSE_ID } from '../../../../../constants';
import { get } from 'lodash'
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../utils';

export const fetchCourseData = async (courseId) => {
  const query = `{
    courses(filter:{
      ${courseId ? `id:"${courseId}"` : `title: "${GLOBAL_COURSE_TITLE}"`}
    }) {
      topics {
        id
        order
        title
      }
    }
  }`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.courses[0]', null);
  return data;
};

const fetchMentorMenteeSession = async (userId, topicId, courseId) => {
  const query = `{
    mentorMenteeSessions(filter:{
      and:[
        { menteeSession_some:{user_some:{id:"${userId}"}}}
        { topic_some: {id: "${topicId}" }}
        {course_some: {
          ${courseId ? `id: "${courseId}"` : `title: ${GLOBAL_COURSE_TITLE}`}
        }}
      ]
    }) {
      id
      isSubmittedForReview
      sessionStatus
      topic {
        title
      }
    }
  }`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.mentorMenteeSessions');
  return data;
};

const fetchUserCourse = async (userId, courseId) => {
  const query = `{
    userCourses(filter:{
      and:[
        {courses_some: {
          ${courseId ? `id: "${courseId}"` : `title: ${GLOBAL_COURSE_TITLE}`}
        }}
        { user_some: { id: "${userId}" }}
      ]
    }) {
      id
      homeworkStreaks {
        createdAt
      }
      courses {
        id
      }
    }
  }`;
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.userCourses[0]', null);
  return data;
};

const updateMentorMenteeSession = async (id, isReviewSubmittedOnTime) => {
  const query = `mutation {
    updateMentorMenteeSession(id: "${id}", input: {
      isReviewSubmittedOnTime: ${isReviewSubmittedOnTime}
    }) {
      id
    }
  }`;
  log(`...................MMS QUERY, ${JSON.stringify(query, null, 2)}`);
  const res = await callLocalGraphqlApi(query);
  const data = get(res, 'data.updateMentorMenteeSession', null);
  return data;
};

const updateUserCourseDoc = async (id, input) => {
  const query = `mutation updateUserCourse($input: UserCourseUpdate!){
    updateUserCourse(id: "${id}", input: $input) {
      id
    }
  }`;
  const variables = {
    input,
  };
  log(`...................UCOURSE QUERY, ${JSON.stringify(query, null, 2)}`);
  const res = await callLocalGraphqlApi(query, null, variables);
  const data = get(res, 'data.updateUserCourse', null);
  return data;
};

const addOrDeleteHomeworkStreaks = async (context, userCourseRes, input, isReviewSubmittedOnTime = false) => {
  log(`.............Input, ${JSON.stringify({ input, isReviewSubmittedOnTime }, null, 2)}`);
  if (userCourseRes && get(userCourseRes, 'courses', []).length) {
    await updateMentorMenteeSession(get(context, 'previousDocument.id', ''), isReviewSubmittedOnTime);
    await updateUserCourseDoc(get(userCourseRes, 'id'), input);
  }
};

/**
 * This method is invoked when homework is submitted for first tym.
 * @param {*} topics 
 * @param {*} userId 
 * @param {*} courseId 
 * @param {*} context 
 * @param {*} topicId 
 * @returns void
 */
export const submittedForReviewStreaksFlow = async (topics, userId, courseId, context, topicId) => {
  const sortedTopics = topics.sort((a, b) => a.order - b.order || -1);
  const currentTopicIndex = sortedTopics.findIndex((topic) => topic.id === topicId);
  const nextTopicId = get(sortedTopics[currentTopicIndex + 1], 'id');
  log(`.............Next Topic, ${JSON.stringify(sortedTopics[currentTopicIndex + 1], null, 2)}`);
  const userCourseRes = await fetchUserCourse(userId, courseId);
  const streaksInput = {
    push: {
      courseConnectId: courseId || OLD_COURSE_ID,
      mentorMenteeSessionConnectId: get(context, 'previousDocument.id', ''),
      createdAt: new Date().toISOString(),
    },
  };
  if (nextTopicId) {
    const nextMentorMenteeSession = await fetchMentorMenteeSession(userId, nextTopicId, courseId);
    log(`.............Next MMS, ${JSON.stringify(nextMentorMenteeSession, null, 2)}`);
    // Checking if next MMS exists
    if (nextMentorMenteeSession && nextMentorMenteeSession.length) {
      if (get(nextMentorMenteeSession[0], 'sessionStatus') === 'allotted') {
        // increamenting streaks because next session has not started yet.
        const input = { homeworkStreaks: streaksInput, homeworkStreaksLog: streaksInput };
        await addOrDeleteHomeworkStreaks(context, userCourseRes, input, true);
      } else {
        return;
        /** 
         * @ImpNote
         *  commenting this logic bcuz we only need...
         *  to break streak and update log when next session has started... 
         *  without submitting the homework, below logic would make this...
         *  repetitive. still commenting to understand streaks logic better. 
         * */
        // breaking streaks because next session has started/completed already.
        // const input = { homeworkStreaks: { popAll: true } };
        // await addOrDeleteHomeworkStreaks(context, userCourseRes, input, false);
      }
    }
    if (nextMentorMenteeSession && nextMentorMenteeSession.length === 0) {
      // increamenting streaks because next session has not been booked yet.
      const input = { homeworkStreaks: streaksInput, homeworkStreaksLog: streaksInput };
      await addOrDeleteHomeworkStreaks(context, userCourseRes, input, true);
    }
  }
  if ((currentTopicIndex === (sortedTopics.length - 1)) && !nextTopicId) {
    const input = { homeworkStreaks: streaksInput, homeworkStreaksLog: streaksInput };
    await addOrDeleteHomeworkStreaks(context, userCourseRes, input, true);
  }
};

/**
 * This method is invoked when session is started.
 * @param {*} topics 
 * @param {*} userId 
 * @param {*} courseId 
 * @param {*} context 
 * @param {*} topicId 
 * @returns void
 */
export const sessionStartedStreaksFlow = async (topics, userId, courseId, context, topicId) => {
  const sortedTopics = topics.sort((a, b) => a.order - b.order || -1);
  const currentTopicIndex = sortedTopics.findIndex((topic) => topic.id === topicId);
  const prevTopicId = get(sortedTopics[currentTopicIndex - 1], 'id');
  log(`.............Prev Topic, ${JSON.stringify(get(sortedTopics[currentTopicIndex - 1], 'id'), null, 2)}`);
  if (prevTopicId) {
    const prevMentorMenteeSession = await fetchMentorMenteeSession(userId, prevTopicId, courseId);
    log(`.............Prev MMS, ${JSON.stringify(prevMentorMenteeSession, null, 2)}`);
    if (prevMentorMenteeSession && prevMentorMenteeSession.length && (get(prevMentorMenteeSession[0], 'isSubmittedForReview') === false)) {
      const userCourseRes = await fetchUserCourse(userId, courseId);
      log(`.............Current Streak, ${get(userCourseRes, 'homeworkStreaks', []).length}`);
      if (userCourseRes && get(userCourseRes, 'homeworkStreaks', []).length) {
        const streaksInput = {
          push: {
            courseConnectId: courseId || OLD_COURSE_ID,
            mentorMenteeSessionConnectId: get(context, 'previousDocument.id', ''),
            createdAt: new Date().toISOString(),
          },
        };
        log(`.............Prev USERCOURSE, ${JSON.stringify(userCourseRes, null, 2)}`);
        const input = {
          homeworkStreaks: {
            pop:{
              courseReferenceId: courseId || OLD_COURSE_ID,
            },
          },
          homeworkStreaksLog: streaksInput
        };
        await addOrDeleteHomeworkStreaks(context, userCourseRes, input, false);
      }
    }
  }
};

export const updateHomeworkStreaksMethod = async (sessionStatus, userId, context, topicId, input) => {
    const courseTypeId = get(input, 'course.typeId', '');
    const courseData = await fetchCourseData(courseTypeId);
    const topics = get(courseData, 'topics', []);
    if (sessionStatus === 'started') {
        log('.............In Session Flow');
        sessionStartedStreaksFlow(topics, userId, courseTypeId, context, topicId);
    }
}