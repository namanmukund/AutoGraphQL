import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import { byPassMenteeValidationApps } from '../../../../constants';

const deleteMentorSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted remove corresponding availability slots
   */
  const { previousDocument, appName } = context;
  const { availabilityDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  const { sessionType, country } = input;
  if (sessionType && (sessionType === 'paid' || sessionType === 'batch')) {
    return true;
  }

  // don't increase the availability slot if it is done through backend
  if (byPassMenteeValidationApps.includes(appName)) {
    return true;
  }

  await reduceParticularAvailableSlotOfADate(
    slotTimeStringArray,
    availabilityDate,
    context,
    country,
  );
  return true;
};

export default deleteMentorSessionPostHookMethod;
