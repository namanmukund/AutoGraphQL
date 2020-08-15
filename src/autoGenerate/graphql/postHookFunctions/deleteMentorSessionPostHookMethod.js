import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';

const deleteMentorSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted remove corresponding availability slots
   */
  const { previousDocument } = context;
  const { availabilityDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  await reduceParticularAvailableSlotOfADate(slotTimeStringArray, availabilityDate, context);
};

export default deleteMentorSessionPostHookMethod;
