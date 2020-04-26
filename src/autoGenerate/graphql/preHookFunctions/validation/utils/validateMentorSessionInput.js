// validate mentor session input variables
import validateBookingDate from './validateBookingDate';
import getSelectedSlots from './getSelectedSlots';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMentorSessionInput = (params) => {
  const { input } = params;
  const { availabilityDate, ...slots } = input;

  const slotTimeArray = getSelectedSlots(slots);

  if (!slotTimeArray.length) {
    throw new Error('No slots selected');
  }

  // availabilityDate can be empty in case of update operation
  if (availabilityDate) {
    validateBookingDate(
      availabilityDate,
      slotTimeArray,
      PRE_BOOKING_HOUR_LIMIT,
    );
  }
  return true;
};

export default validateMentorSessionInput;
