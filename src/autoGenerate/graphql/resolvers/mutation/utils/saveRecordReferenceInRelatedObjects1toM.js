// saves a saved document's reference in all type fields to which it is related
import { saveReferenceInRelatedTypeField } from './saveReferenceInRelatedTypeField';

export const saveRecordReferenceInRelatedObjects1toM = (
  relationsArrayOfArray,
  ast,
  authentication,
) => {
  const promisesArray = [];
  relationsArrayOfArray.forEach((relationsTypeArray) => {
    relationsTypeArray.forEach((relationObject) => {
      const updatePromise = saveReferenceInRelatedTypeField(relationObject, ast, authentication);
      if (updatePromise) {
        promisesArray.push(updatePromise);
      }
    });
  });
  return Promise.all(promisesArray);
};
