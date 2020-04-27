// validate mentor session input variables
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { NoSlotSelectedError, OnlyOneSlotAllowedError } from '../../../../../../constants/errors/input';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMenteeSessionInput = (params) => {
  const { input } = params;
  const { bookingDate, ...slots } = input;

  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
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
