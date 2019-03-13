import { createAndReturnRelationObject } from './createAndReturnRelationObject';

const createAndReturnRelationObjectsPromiseArray = (
  relationFieldsArray,
  typeName,
  ast,
  authentication,
  context,
) => {
  const promiseArray = relationFieldsArray.map((fieldObject) => {
    const { fieldName, fieldValue, fieldType, relationName } = fieldObject;
    return createAndReturnRelationObject(
      fieldName,
      fieldValue,
      fieldType,
      relationName,
      typeName,
      ast,
      authentication,
      context,
    );
  });
  return promiseArray;
};
export { createAndReturnRelationObjectsPromiseArray };
