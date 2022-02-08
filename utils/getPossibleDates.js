// method that returns the array of dates
const getPossibleDates = (workingStartDate, workingEndDate, workingDays, eventStartDate, eventEndDate, eventDays) => {
  // here workingDays is Set which hold the integer values of days of the week (0-6), for better lookup
  const dates = [];
  // if we don't have either working or event, return empty dates array
  if (!workingStartDate && !eventStartDate) return dates;
  let currentDate = workingStartDate || eventStartDate;
  /* eslint-disable func-names */
  const addDays = function (daysToAdd) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + daysToAdd);
    return date;
  };
  const endDate = workingEndDate || eventEndDate;
  const considerEvents = eventStartDate && eventEndDate && eventDays;
  while (currentDate <= endDate) {
    // console.log('workingDays', workingDays);
    // console.log('considerEvents', considerEvents);
    if (workingDays.has(currentDate.getDay())) {
      if (considerEvents) {
        const isEventDate = (currentDate <= eventEndDate && currentDate >= eventStartDate && eventDays.has(currentDate.getDay()));
        if (!isEventDate) {
          dates.push(currentDate);
        }
      } else {
        dates.push(currentDate);
      }
    }
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

export default getPossibleDates;
