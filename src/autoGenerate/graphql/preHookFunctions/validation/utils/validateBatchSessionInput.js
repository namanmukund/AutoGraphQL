// validate mentor session input variables
import { get } from 'lodash';
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import {
  MissingMandatoryInputInRequestError,
  NoSlotSelectedError,
  OnlyOneSlotAllowedError,
} from '../../../../../../constants/errors/input';
import {
  ALLOWED_ROLE_FOR_MANUAL_SESSIONS, TIME_DIFF_FOR_MANUAL_SESSION,
} from '../../../../../../constants';

let PRE_BOOKING_HOUR_LIMIT = 0;
const validateBatchSessionInput = async (params, context, originMethod, userRoleFromContext) => {
  const { input } = params;
  const { bookingDate, ...slots } = input;
  if (!bookingDate && originMethod === 'addBatch') {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'bookingDate is mandatory',
      },
    });
  }
  const slotTimeArray = getSelectedSlotsTime(slots);

  if (!slotTimeArray.length && originMethod === 'addBatch') {
    throw new NoSlotSelectedError();
  } else if (slotTimeArray.length > 1) {
    throw new OnlyOneSlotAllowedError();
  }
  context.slotTimeArray = slotTimeArray;
  if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && get(context, 'isTrialSession', false)) {
    PRE_BOOKING_HOUR_LIMIT = TIME_DIFF_FOR_MANUAL_SESSION;
  }
  // eslint-disable-next-line no-unused-expressions
  bookingDate && slotTimeArray && slotTimeArray.length && validateBookingDate(
    bookingDate,
    slotTimeArray,
    PRE_BOOKING_HOUR_LIMIT,
  );

  return true;
};

export default validateBatchSessionInput;
