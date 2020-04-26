const validateBookingDate = (
  bookingDate,
  slotTime,
  PRE_BOOKING_HOUR_LIMIT = 0,
) => {
  const date = new Date(bookingDate);
  const currentDate = new Date();
  // if date is same check for hours
  if (slotTime && slotTime.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const st of slotTime) {
      if (date.getDate() === currentDate.getDate()
        && date.getMonth() === currentDate.getMonth()
        && date.getFullYear() === currentDate.getFullYear()
        && st <= (Math.floor(currentDate.getHours()) + PRE_BOOKING_HOUR_LIMIT)
      ) {
        throw new Error("Can't book for past hours");
      }
    }
  }

  // if date belongs to the past
  if (date.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
    throw new Error("Can't book for past");
  }
};

export default validateBookingDate;
