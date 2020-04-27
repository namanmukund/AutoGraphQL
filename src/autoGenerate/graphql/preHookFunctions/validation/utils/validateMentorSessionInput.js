// validate mentor session input variables
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { NoSlotSelectedError } from '../../../../../../constants/errors/input';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMentorSessionInput = (params) => {
  const { input } = params;
  const { availabilityDate, ...slots } = input;

  if (!availabilityDate) {
    throw new Error('no date is selected');
  }
  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  }

  validateBookingDate(
    availabilityDate,
    slotTimeArray,
    PRE_BOOKING_HOUR_LIMIT,
  );
  return true;
};

export default validateMentorSessionInput;
