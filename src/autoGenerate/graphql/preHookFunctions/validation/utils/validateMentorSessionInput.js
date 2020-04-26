// validate mentor session input variables
const PRE_BOOKING_HOUR_LIMIT = 0;
const validateMentorSessionInput = (params) => {
  const { input } = params;
  const { availabilityDate, ...slots } = input;

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
  }

  // availabilityDate can be empty in case of update operation
  if (availabilityDate) {
    const date = new Date(availabilityDate);
    const currentDate = new Date();

    // if date is same check for hours
    // eslint-disable-next-line no-restricted-syntax
    for (const st of slotTimeArray) {
      if (date.getDate() === currentDate.getDate()
        && date.getMonth() === currentDate.getMonth()
        && date.getFullYear() === currentDate.getFullYear()
        && st <= (Math.floor(currentDate.getHours()) + PRE_BOOKING_HOUR_LIMIT)
      ) {
        throw new Error("Can't book for past hours");
      }
    }

    // if date belongs to the past
    if (date.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
      throw new Error("Can't book for past");
    }
  }
  return true;
};

export default validateMentorSessionInput;
