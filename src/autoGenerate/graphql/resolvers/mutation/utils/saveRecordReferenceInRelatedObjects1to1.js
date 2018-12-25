// saves a saved document's reference in all type fields to which it is related
import { saveReferenceInRelatedTypeField } from './saveReferenceInRelatedTypeField';

export const saveRecordReferenceInRelatedObjects1to1 = (relationsArray, ast, authentication) => {
  const promisesArray = [];
  relationsArray.forEach((relationObject) => {
    // find key in related type
    const updatePromise = saveReferenceInRelatedTypeField(relationObject, ast, authentication);
    if (updatePromise) {
      promisesArray.push(updatePromise);
    }
  });

  return Promise.all(promisesArray);
};
