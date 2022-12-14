import { get } from 'lodash';
import modelOptionsDoc from '../../../constants/modelOptionsDoc';

const getModelOptionsString = (typeName) => {
  // if typeName does not exist in config, return empty string
  if (!typeName || !get(modelOptionsDoc, typeName)) {
    return '';
  }

  const modelOptions = get(modelOptionsDoc, typeName);

  let optionsString = '';
  Object.keys(modelOptions).forEach((option) => {
    optionsString += `${option}: [${modelOptions[option].join(', ')}], `;
  });
  return optionsString;
};

export default getModelOptionsString;
