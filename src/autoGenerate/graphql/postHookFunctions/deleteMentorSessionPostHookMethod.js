import getSelectedSlotsStringArray from './utils/getSelectedSlotsStringArray';
import reduceParticularAvailableSlotOfADate from './utils/reduceParticularAvailableSlotOfADate';
import getSlotCountByProductType from './utils/getSlotCountByProductType';

const deleteMentorSessionPostHookMethod = async (input, mutationName, context) => {
  /*
  Since doc is deleted remove corresponding availability slots
   */
  const { previousDocument } = context;
  const { availabilityDate, slotType, ...slots } = previousDocument;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotCount = getSlotCountByProductType(slotType);

  await reduceParticularAvailableSlotOfADate(
    slotTimeStringArray,
    availabilityDate,
    context,
    '',
    slotCount,
  );
};

export default deleteMentorSessionPostHookMethod;
