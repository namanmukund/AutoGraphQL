// validate mentor session input variables
const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMenteeSessionInput = (params) => {
  const { input } = params;
  const { bookingDate, ...slots } = input;
  const slotTimeArray = [];

  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      if (slots[slot]) {
        slotTimeArray.push(slot.toString().split('slot')[1]);
      }
    }
  });

  if (!slotTimeArray.length) {
    throw new Error('No slots selected');
  } else if (slotTimeArray.length > 1) {
    throw new Error('Can only book one slot in a day');
  }

  // bookingDate can be empty in case of update operation
  if (bookingDate) {
    const date = new Date(bookingDate);
    const currentDate = new Date();

    // if date is same check for hours
    if (date.getDate() === currentDate.getDate()
      && date.getMonth() === currentDate.getMonth()
      && date.getFullYear() === currentDate.getFullYear()
      && slotTimeArray[0] <= (Math.floor(currentDate.getHours()) + PRE_BOOKING_HOUR_LIMIT)
    ) {
      throw new Error("Can't book for past hours");
    }

    // if date belongs to the past
    if (date.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
      throw new Error("Can't book for past");
    }
  }
  return true;
};

export default validateMenteeSessionInput;
