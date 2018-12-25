// Check date validity
import { parsedDate } from '../../../../../utils';

const checkDateValidity = (date) => {
  if (isNaN(parsedDate(date))) {
    return null;
  }
  return date;
};

export default checkDateValidity;
