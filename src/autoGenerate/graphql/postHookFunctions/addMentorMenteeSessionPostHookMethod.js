import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import extractMentorMenteeSessionAndSendMessage from './utils/extractMentorMenteeSessionAndSendMessage';
import { backendApps } from '../../../../constants';
import sendBookingReminderOrConfirmationB2BC from './utils/sendBookingReminderOrConfirmationB2B2C';

const addMentorMenteeSessionPostHookMethod = async (input, params, context) => {
  // don't do anything if it is done through backend
  const { appName } = context;
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

    if (get(input, 'sessionStatus') === 'started') {
      setSessionStartedLeadsquared(userInfo, topicInfo);
    }

    // send message to mentor regarding the session
    if (get(topicInfo, 'data.topic.order') === 1) {
      const slotTimeStringArray = getSelectedSlotsStringArray(slots);
      await extractMentorMenteeSessionAndSendMessage(bookingDate, slotTimeStringArray, mentorSessionConnectId, userInfo, topicInfo);
    }
  }
};

export default addMentorMenteeSessionPostHookMethod;
