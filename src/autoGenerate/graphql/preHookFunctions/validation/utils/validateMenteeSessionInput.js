// validate mentor session input variables
import validateBookingDate from './validateBookingDate';
import getSelectedSlots from './getSelectedSlots';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMenteeSessionInput = (params) => {
  const { input } = params;
  const { bookingDate, ...slots } = input;

  const slotTimeArray = getSelectedSlots(slots);

  if (!slotTimeArray.length) {
    throw new Error('No slots selected');
  } else if (slotTimeArray.length > 1) {
    throw new Error('Can only book one slot in a day');
  }

  // bookingDate can be empty in case of update operation
  if (bookingDate) {
    validateBookingDate(
      bookingDate,
      slotTimeArray,
      PRE_BOOKING_HOUR_LIMIT,
    );
  }
  return true;
};

export default validateMenteeSessionInput;
