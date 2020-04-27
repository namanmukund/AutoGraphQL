const getSelectedSlotsTime = (slots) => {
  const slotTimeArray = [];
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      if (slots[slot]) {
        slotTimeArray.push(Number(slot.toString().split('slot')[1]));
      }
    }
  });
  return slotTimeArray.sort((a, b) => b - a);
};

export default getSelectedSlotsTime;
