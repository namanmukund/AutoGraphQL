import get from 'lodash/get';
import moment from 'moment';
import getSelectedSlotsTime from './getSelectedSlotsTime';

const checkSessionsWithStartAndEndTime = (inputStartMinute = 0, inputEndMinute = 0, bookingDate, inputSlots, findSession) => {
  const sentSlotsArray = getSelectedSlotsTime(inputSlots);
  if (inputEndMinute) {
    if (inputEndMinute > 60) {
      let i = 1;
      let tempEndMinutes = inputEndMinute;
      while (tempEndMinutes > 60) {
        let laterSlot = sentSlotsArray[0] + i;
        if (laterSlot > 23) {
          laterSlot -= 23;
        }
        sentSlotsArray.push(laterSlot);
        i += 1;
        tempEndMinutes -= 60;
      }
    }
  }
  if (sentSlotsArray[0] - 1 >= 0) {
    sentSlotsArray.push(sentSlotsArray[0] - 1);
  }
  if (sentSlotsArray[0] - 2 >= 0) {
    sentSlotsArray.push(sentSlotsArray[0] - 2);
  }
  const inputSlot = sentSlotsArray[0];
  const newInputStartMinutes = moment(bookingDate).set('hours', inputSlot).add(inputStartMinute, 'minutes');
  const newInputEndMinutes = moment(bookingDate).set('hours', inputSlot).add(inputEndMinute, 'minutes');
  const sessionSlot = getSelectedSlotsTime(findSession);
  const sessionStartMinute = get(findSession, 'startMinutes');
  const sessionEndMinute = get(findSession, 'endMinutes');
  const sessionStartMinutes = moment(bookingDate).set('hours', sessionSlot[0]).add(sessionStartMinute, 'minutes');
  const sessionEndMinutes = moment(bookingDate).set('hours', sessionSlot[0]).add(sessionEndMinute, 'minutes');
  //   console.log({
  //     newInputStartMinutes: new Date(newInputStartMinutes).toDateString(),
  //     newInputEndMinutes: new Date(newInputEndMinutes).toDateString(),
  //     sessionStartMinutes: new Date(sessionStartMinutes).toDateString(),
  //     sessionEndMinutes: new Date(sessionEndMinutes).toDateString(),
  //   });
  //   console.log(newInputStartMinutes.isBetween(sessionStartMinutes, sessionEndMinutes), newInputEndMinutes.isBetween(sessionStartMinutes, sessionEndMinutes));
  if (!(newInputEndMinutes <= sessionStartMinutes || newInputStartMinutes >= sessionEndMinutes)) {
    return true;
  }
  return false;
};

export default checkSessionsWithStartAndEndTime;
