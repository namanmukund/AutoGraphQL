import moment from 'moment';

const getTimeZoneDate = (date, timeZone) => {
  const timeZoneDate = moment(date).tz(timeZone).format('MMM DD h:mm A');
  return timeZoneDate;
};

export default getTimeZoneDate;
