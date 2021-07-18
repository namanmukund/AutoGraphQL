import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import extractMentorMenteeSessionAndSendMessage from './utils/extractMentorMenteeSessionAndSendMessage';
import { backendApps } from '../../../../constants';
import addSessionLog from './utils/addSessionLog';

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
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);

    if (get(input, 'sessionStatus') === 'started') {
      setSessionStartedLeadsquared(userInfo, topicInfo);
    }

    // send message to mentor regarding the session
    if (get(topicInfo, 'data.topic.order') === 1) {
      await extractMentorMenteeSessionAndSendMessage(bookingDate, slotTimeStringArray, mentorSessionConnectId, userInfo, topicInfo);
    }

    // update session log entry
    const courseId = get(input, 'course.typeId', '');
    const clientId = get(userInfo, 'data.user.id', '');
    const topicId = get(topicInfo, 'data.topic.id', '');
    const sessionStatus = get(input, 'sessionStatus');
    const batchCode = get(userInfo, 'data.user.studentProfile.batch.code', '');
    addSessionLog(bookingDate, slotTimeStringArray, clientId, topicId, currentUser, courseId, 'addMentorMenteeSession', batchCode, mentorSessionConnectId, sessionStatus);
  }
};

export default addMentorMenteeSessionPostHookMethod;
