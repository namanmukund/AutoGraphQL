import { map } from 'lodash';
import compileFilter from './compileFilter';
import { splitOnFirstUnderscore } from './utils';
import { allFilters } from '../../../../../constants';

// Processes a filter
const processFilter = (data, filterParam) => {
  let result = true;
  // Sanitize filter for base level
  const filter = map(filterParam, (value, key) => ({ [key]: value }));
  // Process filter
  result = compileFilter.and(data, filter);
  return result;
};

const recursiveFilter = (data, filterKey, filterValue) => {
  // And filter
  if (filterKey === 'and' || filterKey === 'AND') {
    return compileFilter.and(data, filterValue);
  }
  // Or filter
  if (filterKey === 'or' || filterKey === 'OR') {
    return compileFilter.or(data, filterValue);
  }
  // Get filterkey name and param
  const [filterKeyName, filterKeyParam] = splitOnFirstUnderscore(filterKey);
  // not filter
  if (filterKeyParam === 'not') {
    return compileFilter.not(data, filterKeyName, filterValue);
  }
  // in filter
  if (filterKeyParam === 'in') {
    return compileFilter.in(data, filterKeyName, filterValue);
  }
  // not in filter
  if (filterKeyParam === 'not_in') {
    return compileFilter.not_in(data, filterKeyName, filterValue);
  }
  // lt filter
  if (filterKeyParam === 'lt') {
    return compileFilter.lt(data, filterKeyName, filterValue);
  }
  // gt filter
  if (filterKeyParam === 'gt') {
    return compileFilter.gt(data, filterKeyName, filterValue);
  }
  // contains filter
  if (filterKeyParam === 'contains') {
    return compileFilter.contains(data, filterKeyName, filterValue);
  }
  // ConnectId filter
  if (filterKeyParam.includes(allFilters.referenceId)) {
    const splitFilterKeyParam = filterKeyParam.split(allFilters.referenceId);
    return compileFilter.checkReferenceIndex(data, splitFilterKeyParam[0], { typeId: filterValue });
  }

  // not_contains filter
  if (filterKeyParam === 'not_contains') {
    return compileFilter.not_contains(data, filterKeyName, filterValue);
  }
  // startsWith filter
  if (filterKeyParam === 'startsWith') {
    return compileFilter.startsWith(data, filterKeyName, filterValue);
  }
  // equal to
  return compileFilter.equal(data, filterKey, filterValue);
};

export { processFilter, recursiveFilter };
