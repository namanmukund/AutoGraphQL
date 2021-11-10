import {
  BookingDateInvalidError,
  SlotsInvalidError,
} from '../../../../../../constants/errors';
import getSelectedSlotsTime from './getSelectedSlotsTime';

const validateTimeTableRule = async (timeTableRule) => {
  const {
    bookingDate, allottedMentorConnectId, mentorSessionConnectId, ...slots
  } = timeTableRule;

  const isValidBookingDate = (bookingDate && bookingDate.length > 0);

  const selectedSlots = getSelectedSlotsTime(slots);
  const isValidSlots = (selectedSlots.length === 1);

  if (!isValidBookingDate) {
    throw new BookingDateInvalidError();
  } else if (!isValidSlots) {
    throw new SlotsInvalidError();
  }
};

export {
  validateTimeTableRule,
};
