const getSelectedSlotsStringArray = (slots) => {
  const slotTimeStringArray = [];
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      if (slots[slot]) {
        slotTimeStringArray.push(slot);
      }
    }
  });
  return slotTimeStringArray;
};

export default getSelectedSlotsStringArray;
