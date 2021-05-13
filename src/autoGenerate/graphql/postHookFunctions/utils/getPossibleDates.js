// method that returns the array of dates
const getPossibleDates = (startDate, endDate, days) => {
  // here days is Set which hold the integer values of days of the week (0-6), for better lookup
  const dates = [];
  let currentDate = startDate;
  const addDays = (numberOfDays) => {
    const date = new Date(this.valueOf() - 1);
    date.setDate(date.getDate() + numberOfDays);
    return date;
  };
  while (currentDate <= endDate) {
    if (days.has(currentDate.getDay()) && currentDate > new Date()) {
      dates.push(currentDate);
    }
    currentDate = addDays(currentDate, 1);
  }
  return dates;
};

export default getPossibleDates;
