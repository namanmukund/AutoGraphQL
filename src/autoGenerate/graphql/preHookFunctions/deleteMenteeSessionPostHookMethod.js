import { get } from 'lodash';
import getSelectedSlotsStringArray from '../postHookFunctions/utils/getSelectedSlotsStringArray';
import increaseParticularAvailableSlotOfADate from '../postHookFunctions/utils/increaseParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from '../postHookFunctions/utils/extractMenteeSessionInfoAndSendEmail';
import isTrialSession from '../resolvers/utils/isTrialSession';
import deleteMenteeBookingLeadSquared from '../postHookFunctions/leadsquared/deleteMenteeBookingLeadSquared';
import getMenteeInfo from '../postHookFunctions/utils/getMenteeInfo';
import getTopicInfo from '../postHookFunctions/utils/getTopicInfo';

const deleteMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted increase corresponding availability slots
   */
  const { previousDocument } = context;
  const { bookingDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const isTrial = await isTrialSession(input.topic.typeId);
  const userInfo = await getMenteeInfo(get(input, 'user.typeId'));
  const topicInfo = await getTopicInfo(get(input, 'topic.typeId'));
  const { userCountryCode } = context;

  if (typeof isTrial === 'boolean' && isTrial && userCountryCode === '+91') {
    await increaseParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
  }
  deleteMenteeBookingLeadSquared(userInfo, topicInfo);
  await extractMenteeSessionInfoAndSendEmail('delete', input, bookingDate, slotTimeStringArray, '', [], userInfo, topicInfo);
};

export default deleteMenteeSessionPostHookMethod;
