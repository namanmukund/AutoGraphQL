// validate mentor session input variables
import { get } from 'lodash';
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import {
  MissingMandatoryInputInRequestError,
  NoSlotSelectedError,
  OnlyOneSlotAllowedError,
} from '../../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import availableSlotsQuery from '../../../graphqlQueries/availableSlotsQuery';
import getSelectedSlotsStringArray from '../../../postHookFunctions/utils/getSelectedSlotsStringArray';
import { NoSlotsAvailableForBooking } from '../../../../../../constants/errors/db';
import { byPassMenteeValidationApps } from '../../../../../../constants';

const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMenteeSessionInput = async (params, context) => {
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

  const { isTrialSession, userCountryCode, appName } = context;
  if (typeof isTrialSession === 'boolean' && !isTrialSession) {
    return true;
  }

  // by pass validation if call is from backend
  if (byPassMenteeValidationApps.includes(appName)) {
    return true;
  }

  // temporary code to allow users to book multiple slots at a time for outside India
  // we would have to eventually change it on role=school etc.
  if (userCountryCode && userCountryCode !== '+91') {
    return true;
  }

  // check if the slot mentee trying to book is available in availableSlot
  const availableSlotsRes = await callLocalGraphqlApi(availableSlotsQuery(bookingDate));
  const availableSlots = get(availableSlotsRes, 'data.availableSlots');
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  if (!availableSlots || !availableSlots.length) {
    throw new NoSlotsAvailableForBooking();
  }
  if (!(availableSlots[0][slotTimeStringArray[0]] > 0)) {
    throw new NoSlotsAvailableForBooking();
  }
  // eslint-disable-next-line no-param-reassign
  context.availableSlots = availableSlots;
  return true;
};

export default validateMenteeSessionInput;
