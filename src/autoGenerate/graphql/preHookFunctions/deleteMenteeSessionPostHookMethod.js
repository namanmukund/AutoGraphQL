import getSelectedSlotsStringArray from '../postHookFunctions/utils/getSelectedSlotsStringArray';
import increaseParticularAvailableSlotOfADate from '../postHookFunctions/utils/increaseParticularAvailableSlotOfADate';

const deleteMenteeSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted increase corresponding availability slots
   */
  const { previousDocument } = context;
  const { bookingDate, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  await increaseParticularAvailableSlotOfADate(slotTimeStringArray, bookingDate, context);
};

export default deleteMenteeSessionPostHookMethod;
