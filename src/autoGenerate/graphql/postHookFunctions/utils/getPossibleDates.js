// method that returns the array of dates
const getPossibleDates = (startDate, endDate, days) => {

  // here days is Set which hold the integer values of days of the week (0-6), for better lookup
  var dates = [],
    currentDate = startDate,
    addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
  while (currentDate <= endDate) {
    if (days.has(currentDate.getDay() - 1)) {
      dates.push(currentDate);
    }
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
}

export default getPossibleDates;
