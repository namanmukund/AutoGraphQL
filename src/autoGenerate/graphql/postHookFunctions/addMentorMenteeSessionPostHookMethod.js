import { get } from 'lodash';
import { setSessionStartedLeadsquared } from './leadsquared';
import getMenteeInfo from './utils/getMenteeInfo';
import getTopicInfo from './utils/getTopicInfo';
import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import extractMentorMenteeSessionAndSendMessage from './utils/extractMentorMenteeSessionAndSendMessage';

const addMentorMenteeSessionPostHookMethod = async (input, params, context) => {
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
};

export default addMentorMenteeSessionPostHookMethod;
