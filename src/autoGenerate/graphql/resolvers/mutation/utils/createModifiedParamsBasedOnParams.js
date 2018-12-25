import { camelCase } from 'lodash';
import { genericCodeApiQuery } from './genericCodeApiQuery';
import { idBasedOnCodeAndModel } from './idBasedOnCodeAndModel';

const createModifiedParamsBasedOnParams = async (params, typeName, relatedType) => {
  const input = params;
  const argumentKeys = Object.keys(input);
  /* If there are 2 arguments and both are of ids and no argument of code is
  present then no need of change in the input */
  if (argumentKeys[1].indexOf(`${typeName}Id`) >= 0 && argumentKeys[0].indexOf(`${relatedType}Id`) >= 0) {
    return input;
  }
  /* If there are 2 arguments and both are of ids and no argument of code is
  present then no need of change in the input and the arguments are interchanged */
  if (argumentKeys[0].indexOf(`${typeName}Id`) >= 0 && argumentKeys[1].indexOf(`${relatedType}Id`) >= 0) {
    return input;
  }
  /* If there are 2 arguments and one of the argument is of code present then
  no need of change in the input */
  if (argumentKeys[0].indexOf(`${typeName}Code`) >= 0 || argumentKeys[1].indexOf(`${typeName}Code`) >= 0) {
    let fieldWithCode = argumentKeys[0];
    if (argumentKeys[1].indexOf(`${typeName}Code`) >= 0) {
      fieldWithCode = argumentKeys[1];
    }
    const queryBasedOnCode = genericCodeApiQuery(typeName, input[fieldWithCode]);
    const typeId = await idBasedOnCodeAndModel(queryBasedOnCode, camelCase(typeName));
    const idField = fieldWithCode.replace('Code', 'Id');
    /* delete the key as in the input there should be 2 inputs only so the field
    with code will be deleted and then its typeid field will be added */
    delete input[fieldWithCode];
    input[idField] = typeId;
  }
  /* If there are 2 arguments and one of the argument is of code present then
  no need of change in the input anmd if arguments are interchanged */
  if (argumentKeys[1].indexOf(`${relatedType}Code`) >= 0 || argumentKeys[0].indexOf(`${relatedType}Code`) >= 0) {
    let fieldWithCode = argumentKeys[0];
    if (argumentKeys[1].indexOf(`${relatedType}Code`) >= 0) {
      fieldWithCode = argumentKeys[1];
    }
    const queryBasedOnCode = genericCodeApiQuery(relatedType, input[fieldWithCode]);
    const relatedTypeId = await idBasedOnCodeAndModel(queryBasedOnCode, camelCase(relatedType));
    const idField = fieldWithCode.replace('Code', 'Id');
    /* delete the key as in the input there should be 2 inputs only so the field
    with code will be deleted and then its typeid field will be added */
    delete input[fieldWithCode];
    input[idField] = relatedTypeId;
  }
  return input;
};
export { createModifiedParamsBasedOnParams };
