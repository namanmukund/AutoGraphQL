const addHoursToDate = (dt, hours) => {
  const date = new Date(dt);
  return new Date(date.setHours(hours));
};

export default addHoursToDate;
