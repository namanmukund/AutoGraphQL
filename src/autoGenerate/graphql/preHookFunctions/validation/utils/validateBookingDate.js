import { InvalidDateError, InvalidTimeError } from '../../../../../../constants/errors/input';
import isToday from '../../../../../../utils/isToday';

const validateBookingDate = (
  bookingDate,
  slotTime,
  PRE_BOOKING_HOUR_LIMIT = 1,
) => {
  const date = new Date(bookingDate);
  const currentDate = new Date();
  // REVERT TEMP BYPASS CHECK
  // eslint-disable-next-line no-constant-condition
  if (false) {
    // if date is same check for hours
    if (slotTime && slotTime.length
        && isToday(date)) {
      // eslint-disable-next-line no-restricted-syntax
      for (const st of slotTime) {
        if (st <= (Math.floor(currentDate.getHours()) + PRE_BOOKING_HOUR_LIMIT)) {
          throw new InvalidTimeError();
        }
      }
    }

    // if date belongs to the past
    if (date.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
      throw new InvalidDateError();
    }
  }
  return true;
};

export default validateBookingDate;
