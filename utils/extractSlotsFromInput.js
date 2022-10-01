import { slotTimes } from '../constants';

const extractSlotsFromInput = (slots) => {
  const filteredSlots = {};
  let filteredSlotsCount = 0;
  const seen = new Set();
  let filteredSlotsString = '';
  let filteredSlotsStringForFilterQuery = '';
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      filteredSlots[slot] = slots[slot];
      filteredSlotsCount += 1;
      filteredSlotsString += ` ${slot}: ${slots[slot]} `;
      if (slots[slot]) {
        filteredSlotsStringForFilterQuery += ` {${slot}: ${slots[slot]}} `;
      }
      seen.add(slot);
    }
  });

  // checking for cases  when all slots aren't passed as param
  // setting the rest of the slots as false

  slotTimes.forEach((time) => {
    if (!seen.has(time)) {
      filteredSlots[time] = false;
      filteredSlotsString += ` ${time}: false `;
    }
  });

  return {
    filteredSlotsCount,
    filteredSlots,
    filteredSlotsString,
    filteredSlotsStringForFilterQuery,
  };
};

export default extractSlotsFromInput;
