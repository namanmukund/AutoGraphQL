import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import extractMentorMenteeSessionAndSendMessage from './utils/extractMentorMenteeSessionAndSendMessage';
import { backendApps } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';
import { updateHomeworkStreaksMethod } from './utils/homeworkStreakMethods';
import addToMentorMenteeSessionStudentProfile from './utils/addToMentorMenteeSessionStudentProfile';
import addToMentorAvailabilitySlotMentorMenteeSession from './utils/addToMentorAvailabilitySlotMentorMenteeSession';
import getCourseInfo from './utils/getCourseInfo';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../utils/getSlotTimesInString';
import isMentorChild from './utils/isMentorChild';

const getMentorMenteeSessionData = async (id) => {
  const query = `
    query{
      mentorMenteeSession(id:"${id}"){
        id
        isAudit
        sessionStatus
        isPostSalesAudit
        isSubmittedForReview
        topic{
          id
          order
        }
        menteeSession{
          id
          user {
            studentProfile {
              batch {
                code
              }
            }
          }
          bookingDate
          ${getSlotTimesInString()}
        }
        mentorSession {
          id
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSession');
};

const addMentorMenteeSessionPostHookMethod = async (input, params, context) => {
  // don't do anything if it is done through backend
  const { appName, currentUser } = context;
  if (!backendApps.includes(appName)) {
    // add user on leadsquared
    const { menteeSession, mentorSessionConnectId } = context;
    const {
      id: menteeSessionId,
      user,
      bookingDate,
      ...slots
    } = menteeSession;
    const userInfo = await getMenteeInfo(get(user, 'id'));
    const topicInfo = await getTopicInfo(get(params, 'topicConnectId'));
    const courseInfo = await getCourseInfo(get(params, 'courseConnectId'));
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = get(topicInfo, 'data.topic.id', '');
    const sessionStatus = get(input, 'sessionStatus');
    const mentorMenteeSessionId = get(input, 'id');
    const mentorMenteeSessionDoc = await getMentorMenteeSessionData(mentorMenteeSessionId);
    const isItMentorChild = await isMentorChild(clientId);
    context.previousDocument = mentorMenteeSessionDoc;
    if (!isItMentorChild) {
      if (get(input, 'sessionStatus') === 'started') {
        setSessionStartedLeadsquared(userInfo, topicInfo);
        updateHomeworkStreaksMethod(clientId, context, topicId, input);
      }
      // send message to mentor regarding the session
      if (get(topicInfo, 'data.topic.order') === 1 && mentorSessionConnectId) {
        await extractMentorMenteeSessionAndSendMessage(bookingDate, slotTimeStringArray, mentorSessionConnectId, userInfo, topicInfo, input.id, courseInfo);
      }
    }

    // update session log entry
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    const studentProfileId = get(userInfo, 'data.user.studentProfile.id');
    const bookingAgentId = get(userInfo, 'data.user.studentProfile.bookingAgent.id');
    if (studentProfileId) addToMentorMenteeSessionStudentProfile(mentorMenteeSessionId, studentProfileId, bookingAgentId);
    if (context.mentorAvailabilitySlotId) {
      addToMentorAvailabilitySlotMentorMenteeSession(mentorMenteeSessionId, context.mentorAvailabilitySlotId);
    }
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'addMentorMenteeSession', batchCode, mentorSessionConnectId, sessionStatus, '', get(context, 'isManualSession', false));
  }
};

export default addMentorMenteeSessionPostHookMethod;
