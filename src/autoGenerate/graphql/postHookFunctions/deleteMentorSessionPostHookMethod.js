import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';

const deleteMentorSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted remove corresponding availability slots
   */
  const { previousDocument } = context;
  const { availabilityDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  const { sessionType } = input;
  if (sessionType && sessionType === 'paid') {
    return true;
  }
  await reduceParticularAvailableSlotOfADate(slotTimeStringArray, availabilityDate, context);
  return true;
};

export default deleteMentorSessionPostHookMethod;
