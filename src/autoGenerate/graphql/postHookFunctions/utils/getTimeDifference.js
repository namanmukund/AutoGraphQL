import moment from 'moment';

/* eslint-disable no-param-reassign */
const getSlotDifference = (slot = '', date, timeDiff) => {
  if (slot.includes('slot')) slot = slot.split('slot')[1];
  slot = Number(slot);
  const currentTime = moment();
  const newTime = moment(date).set('hours', slot);
  const diff = moment(newTime).diff(moment(currentTime));
  const duration = moment.duration(moment(diff));
  const hoursValue = Math.floor(duration.asHours());
  return hoursValue < timeDiff;
};

export default getSlotDifference;
