// validate mentor session input variables
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import {
  MissingMandatoryInputInRequestError,
  NoSlotSelectedError,
  OnlyOneSlotAllowedError,
} from '../../../../../../constants/errors/input';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateBatchSessionInput = async (params) => {
  const { input } = params;
  const { bookingDate, ...slots } = input;
  if (!bookingDate) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'bookingDate is mandatory',
      },
    });
  }
  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length) {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
  }

  validateBookingDate(
    bookingDate,
    slotTimeArray,
    PRE_BOOKING_HOUR_LIMIT,
  );

  return true;
};

export default validateBatchSessionInput;
