import {
  BookingDateInvalidError,
  SlotsInvalidError,
  AllottedMentorIdInvalidError,
  MentorSessionIdInvalidError,
} from '../../../../../../constants/errors';
import getSelectedSlotsTime from './getSelectedSlotsTime';

const validateTimeTableRule = async (timeTableRule) => {
  const {
    bookingDate, allottedMentorConnectId, mentorSessionConnectId, ...slots
  } = timeTableRule;

  const isValidBookingDate = (bookingDate && bookingDate.length > 0);
  const isValidAllottedMentor = (allottedMentorConnectId && allottedMentorConnectId.length > 0);
  const isValidMentorSessionConnectId = (mentorSessionConnectId && mentorSessionConnectId.length > 0);

  const selectedSlots = getSelectedSlotsTime(slots);
  const isValidSlots = (selectedSlots.length === 1);

  if (!isValidBookingDate) {
    throw new BookingDateInvalidError();
  } else if (!isValidAllottedMentor) {
    throw new AllottedMentorIdInvalidError();
  } else if (!isValidMentorSessionConnectId) {
    throw new MentorSessionIdInvalidError();
  } else if (!isValidSlots) {
    throw new SlotsInvalidError();
  }
};

export {
  validateTimeTableRule,
};
