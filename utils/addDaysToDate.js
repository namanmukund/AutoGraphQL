// adds input days to a date object, eg. 7 days to a date
const addDaysToDate = (lastOnlineDate, daysToAdd) => {
  const date = new Date(lastOnlineDate);
  const newDate = date.setDate(date.getDate() + daysToAdd);
  return new Date(newDate);
};

export default addDaysToDate;
