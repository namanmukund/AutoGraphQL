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

/**
 * Convert a MongoDB-style sort object ({ key: 1 } or { key: -1 })
 * to Sequelize `order` format ([['key', 'ASC']] or [['key', 'DESC']]).
 *
 * @param {Object} mongoSort - MongoDB sort object
 * @returns {Array} Sequelize order array
 */
export const convertSortToSequelizeOrder = (mongoSort) => {
  if (!mongoSort || typeof mongoSort !== 'object') return [];
  return Object.entries(mongoSort).map(([key, direction]) => [key, direction === 1 ? 'ASC' : 'DESC']);
};

/**
 * Parse orderBy string directly to Sequelize order format.
 *
 * @param {string} params - e.g. "createdAt_ASC"
 * @returns {Array} Sequelize order array e.g. [['createdAt', 'ASC']]
 */
export const getSortOrderForSequelize = (params) => {
  const [key, sortOrder] = params.split('_');
  const sortValueIndex = sortBy.indexOf(`${sortOrder}`);
  if (sortValueIndex <= 1 && sortValueIndex >= 0) {
    return [[key, sortValueIndex === 0 ? 'ASC' : 'DESC']];
  }
  throw new InvalidSortFieldError();
};

export default getSortOrder;
