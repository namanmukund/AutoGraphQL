import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import extractMentorMenteeSessionAndSendMessage from './utils/extractMentorMenteeSessionAndSendMessage';

const addMentorMenteeSessionPostHookMethod = async (input, params, context) => {
  // add user on leadsquared
  const { currentUser, menteeSession, mentorSessionConnectId } = context;
  const userInfo = await getMenteeInfo(get(currentUser, 'id'));
  const topicInfo = await getTopicInfo(get(params, 'topicConnectId'));

  if (get(input, 'sessionStatus') === 'started') {
    setSessionStartedLeadsquared(userInfo, topicInfo);
  }

  // send message to mentor regarding the session
  if (get(topicInfo, 'data.topic.order') === 1) {
    const {
      id: menteeSessionId,
      user,
      bookingDate,
      ...slots
    } = menteeSession;
    const menteeInfo = await getMenteeInfo(get(user, 'id'));
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    await extractMentorMenteeSessionAndSendMessage(bookingDate, slotTimeStringArray, mentorSessionConnectId, menteeInfo, topicInfo);
  }
};

export default addMentorMenteeSessionPostHookMethod;
