const addMinutesToDate = (dt, minutes) => new Date(dt.getTime() + minutes * 60000);

export default addMinutesToDate;
