// validate mentor session input variables
import { difference } from 'lodash';
import validateBookingDate from './validateBookingDate';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { MissingMandatoryInputInRequestError, NoSlotSelectedError } from '../../../../../../constants/errors/input';
import isToday from '../../../../../../utils/isToday';
import { ALLOWED_ROLE_FOR_MANUAL_SESSIONS, backendApps, TIME_DIFF_FOR_MANUAL_SESSION } from '../../../../../../constants';

let PRE_BOOKING_HOUR_LIMIT = 0;
const validateMentorSessionInput = (params, prevMentorSession, context, userRoleFromContext, sessionType) => {
  const { input } = params;
  const { availabilityDate = '', ...slots } = input;

  if (!availabilityDate) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'availabilityDate is mandatory',
      },
    });
  }

  const slotTimeArray = getSelectedSlotsTime(slots, '');

  if (!(prevMentorSession && prevMentorSession.id) && !slotTimeArray.length) {
    throw new NoSlotSelectedError();
  }

  // if call is made from backend, excluding this check for batch
  const { appName } = context;
  if (backendApps.includes(appName)) {
    return true;
  }

  let modifiedSlotTimeArray = slotTimeArray;
  if (prevMentorSession && prevMentorSession.id) {
    const date = new Date(availabilityDate);
    // if date is same check for hours
    if (isToday(date)) {
      const falseOnlyCurrentSlots = getSelectedSlotsTime(slots, 'falseOnly');
      const prevTrueSlots = getSelectedSlotsTime(prevMentorSession, 'trueOnly');
      // if  slot is booked check if it's a new slots which is being booked
      const trueOnlyCurrentSlots = difference(slotTimeArray, prevTrueSlots);
      // if any slots is unbooked check if it correct or not
      modifiedSlotTimeArray = [...trueOnlyCurrentSlots, ...falseOnlyCurrentSlots];
    }
  }
  if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && sessionType === 'trial') {
    PRE_BOOKING_HOUR_LIMIT = TIME_DIFF_FOR_MANUAL_SESSION;
  }
  validateBookingDate(
    availabilityDate,
    modifiedSlotTimeArray,
    PRE_BOOKING_HOUR_LIMIT,
    prevMentorSession,
  );

  return true;
};

export default validateMentorSessionInput;
