const isToday = (date) => {
  const currentDate = new Date();
  return date.getDate() === currentDate.getDate()
    && date.getMonth() === currentDate.getMonth()
    && date.getFullYear() === currentDate.getFullYear();
};

export default isToday;
