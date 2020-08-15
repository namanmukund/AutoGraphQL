import productType from '../../../../../constants/productType';

const getSlotCountByProductType = (slotType) => {
  let slotCount = 1;
  const { oneToOne, oneToTwo, oneToThree } = productType;
  switch (slotType) {
    case oneToOne: {
      slotCount = 1;
      break;
    }
    case oneToTwo: {
      slotCount = 2;
      break;
    }
    case oneToThree: {
      slotCount = 3;
      break;
    }
    default:
  }
  return slotCount;
};

export default getSlotCountByProductType;
