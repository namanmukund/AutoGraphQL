import { sortBy } from '../../../../../constants';
import { InvalidSortFieldError } from '../../../../../constants/errors';

/* get the keys according to the ascending or descending keywords */
const getSortOrder = (params) => {
  const [key, sortOrder] = params.split('_');
  const sortField = {};
  const sortValueIndex = sortBy.indexOf(`${sortOrder}`);
  if (sortValueIndex <= 1 && sortValueIndex >= 0) {
    if (sortValueIndex === 0) {
      sortField[key] = 1;
    } else {
      sortField[key] = -1;
    }
  } else {
    throw new InvalidSortFieldError();
  }
  return sortField;
};

export default getSortOrder;
