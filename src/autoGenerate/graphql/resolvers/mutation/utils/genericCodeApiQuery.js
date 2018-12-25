// this function filters out only local input fields recursively
import { camelCase } from 'lodash';

export const genericCodeApiQuery = (typeName, code) => {
  const modelName = camelCase(typeName);
  const query = `
    query{
    ${modelName} (code:"${code}"){
      id
    }
  }`;
  return query;
};
