import { slotTimes } from '../constants';

const getSlotTimesInString = () => {
  let slotTimesInString = '';
  slotTimes.forEach((slot) => {
    slotTimesInString += `${slot} `;
  });
  return slotTimesInString;
};

export default getSlotTimesInString;
