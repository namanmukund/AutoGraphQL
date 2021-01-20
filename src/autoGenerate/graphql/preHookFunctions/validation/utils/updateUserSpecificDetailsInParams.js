/* eslint-disable no-param-reassign */
import { get } from 'lodash';

const updateUserSpecificDetailsInParams = (userData, params) => {
  const {
    source,
    country,
  } = userData;
  if (!get(params, 'input')) {
    params.input = {};
  }
  if (source) {
    params.input.source = source;
  }
  if (country) {
    params.input.country = country;
  }
  return null;
};

export default updateUserSpecificDetailsInParams;
