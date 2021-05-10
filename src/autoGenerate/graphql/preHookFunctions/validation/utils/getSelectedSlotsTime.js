const getSelectedSlotsTime = (slots, action = 'trueOnly') => {
  const slotTimeArray = [];
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      switch (action) {
        case 'trueOnly': {
          if (slots[slot] === true) {
            slotTimeArray.push(Number(slot.toString().split('slot')[1]));
          }
          break;
        }
        case 'falseOnly': {
          if (slots[slot] === false) {
            slotTimeArray.push(Number(slot.toString().split('slot')[1]));
          }
          break;
        }
        default: {
          if (slots[slot] === true || slots[slot] === false) {
            slotTimeArray.push(Number(slot.toString().split('slot')[1]));
            break;
          }
        }
      }
    }
  });
  return slotTimeArray.sort((a, b) => b - a);
};

export default getSelectedSlotsTime;
