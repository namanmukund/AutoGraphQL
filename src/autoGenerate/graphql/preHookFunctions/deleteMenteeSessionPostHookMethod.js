import getSelectedSlotsStringArray from '../postHookFunctions/utils/getSelectedSlotsStringArray';
import increaseParticularAvailableSlotOfADate from '../postHookFunctions/utils/increaseParticularAvailableSlotOfADate';
import extractMenteeSessionInfoAndSendEmail from '../postHookFunctions/utils/extractMenteeSessionInfoAndSendEmail';
import isTrialSession from '../resolvers/utils/isTrialSession';

const deleteMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted increase corresponding availability slots
   */
  const { previousDocument } = context;
  const { bookingDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const isTrial = await isTrialSession(input.topic.typeId);

  const { userCountryCode } = context;

  if (typeof isTrial === 'boolean' && isTrial && userCountryCode === '+91') {
    await increaseParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
  }
  await extractMenteeSessionInfoAndSendEmail('delete', input, bookingDate, slotTimeStringArray);
};

export default deleteMenteeSessionPostHookMethod;
