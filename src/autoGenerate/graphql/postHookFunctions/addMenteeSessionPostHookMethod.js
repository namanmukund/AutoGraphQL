import { get } from 'lodash';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from './utils/extractMenteeSessionInfoAndSendEmail';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { addMenteeBookingLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import updateUserBookingAgent from './utils/updateUserBookingAgent';
import getTopicInfo from './utils/getTopicInfo';
import { byPassMenteeValidationApps, sessionType } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';
import mentorDemandSingleSlotOperations from './utils/mentorDemandSingleSlotOperations';

const getUserCourses = async (userId) => {
  const query = `
      query{
        userCourses(filter:{
          and:[
            {user_some:{id:"${userId}"}},
          ]
        }){
          id
          courses {
            id
          }
        }
      }
    `;
  const userCoursesRes = await callLocalGraphqlApi(query);
  const userCourses = get(userCoursesRes, 'data.userCourses');
  return userCourses;
};

const addUserCourseQuery = (userId, courseId) => `
  mutation {
      addUserCourse(userConnectId: "${userId}", coursesConnectIds: ["${courseId}"], input: {}) {
          id
      }
  }
`;

const updateUserCourseQuery = (id, courseId) => `
  mutation {
      updateUserCourse(id: "${id}", coursesConnectIds: ["${courseId}"], input: {}) {
          id
      }
  }
`;

const getCourseName = async (id) => {
  const course = await callLocalGraphqlApi(`{
    course(id: "${id}") {
      id
      title
    }
  }`);
  const courseName = get(course, 'data.course.title');
  return courseName;
};

const addMenteeSessionPostHookMethod = async (input, mutationName, context, params) => {
  // don't decrease the availability slot if it is done through backend
  const {
    appName, isBookedByMentee, currentUser, isTrialSession,
  } = context;
  if (!byPassMenteeValidationApps.includes(appName)) {
    /*
    Since addition of session by mentee will consume a slot
     */
    const { id: menteeSessionId, bookingDate, ...slots } = input;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const { availableSlots } = context;
    const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
    const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
    if (typeof isTrialSession === 'boolean' && isTrialSession) {
      await mentorDemandSingleSlotOperations({
        slotTimeStringArray,
        date: bookingDate,
        mutationName,
        sessionType: sessionType.trial,
        sessionId: menteeSessionId,
      });
    }
    await reduceParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context, availableSlots);
    // send email to mentor admin regarding the session
    await extractMenteeSessionInfoAndSendEmail('add', input, bookingDate, slotTimeStringArray, '', [], userInfo, topicInfo);
    if (get(context, 'userIdFromContext')) {
      updateUserBookingAgent(menteeSessionId, get(context, 'userIdFromContext'), bookingDate, get(slotTimeStringArray, '0'));
    }

    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = get(topicInfo, 'data.topic.id', '');
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');

    // update user booking on leadsquared
    const addBookingToLS = async () => {
      const courseName = await getCourseName(courseId);
      const lsInput = input;
      lsInput.courseName = courseName;
      await addMenteeBookingLeadsquared(
        lsInput,
        params,
        slotTimeStringArray,
        userInfo,
        topicInfo,
        isBookedByMentee,
        get(context, 'userIdFromContext'),
      );
    };

    if (!get(userInfo, 'data.user.studentProfile.batch.id')) {
      addBookingToLS();
    }

    /**
     * Add course into UserCourse Collection if not present already
     */
    const userCourses = await getUserCourses(clientId);
    if (userCourses && userCourses.length) {
      const userCourse = userCourses[0];
      const filteredCourse = get(userCourse, 'courses', []).filter((course) => get(course, 'id') === courseId);
      if (filteredCourse.length <= 0) {
        callLocalGraphqlApi(updateUserCourseQuery(get(userCourse, 'id'), courseId));
      }
    } else {
      callLocalGraphqlApi(addUserCourseQuery(clientId, courseId));
    }
    // update session log entry
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'addMenteeSession', batchCode, '', '');
  }
};

export default addMenteeSessionPostHookMethod;
