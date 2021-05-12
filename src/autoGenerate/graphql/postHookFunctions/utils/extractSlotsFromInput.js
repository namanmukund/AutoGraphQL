const extractSlotsFromInput = (slots) => {
  const filteredSlots = {};
  let filteredSlotsString = '';
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      filteredSlots[slot] = slots[slot];
      filteredSlotsString += `${filteredSlots[slot]}: ${slots[slot]}`;
    }
  });
  return { filteredSlots, filteredSlotsString };
}

export default extractSlotsFromInput;