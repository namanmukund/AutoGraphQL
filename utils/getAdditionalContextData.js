import { ADDITIONAL_CONTEXT_VARIABLES_FROM_HEADER } from '../constants';

const getAdditionalContextData = ({ headers }) => {
  const additionalContextData = {};
  if (headers) {
    ADDITIONAL_CONTEXT_VARIABLES_FROM_HEADER
      .forEach(({ contextLabel: key, headerLabel: label }) => {
        if (headers[label]) additionalContextData[key] = headers[label];
      });
  }
  return additionalContextData;
};

export default getAdditionalContextData;
