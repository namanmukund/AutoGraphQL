// saves a saved document's reference in all type fields to which it is related
import { saveRecordReferenceInRelatedObjects1to1 } from './saveRecordReferenceInRelatedObjects1to1';
import { saveRecordReferenceInRelatedObjects1toM } from './saveRecordReferenceInRelatedObjects1toM';

const saveRecordReferenceInRelatedObjects = (
  relationsArray1to1,
  relationsArray1toM,
  record,
  ast,
  authentication,
) => {
  const allRelationObjectsArray1to1 = relationsArray1to1.map((relation) => {
    const relationObject = { ...relation, recordId: record.id };
    return relationObject;
  });
  const allRelationObjectsArray1toM = relationsArray1toM.map((relation) => {
    const relationArray = relation.map((relationObject) => {
      const relationObj = { ...relationObject, recordId: record.id };
      return relationObj;
    });
    return relationArray;
  });
  const promisesArray = [];
  if (allRelationObjectsArray1to1.length) {
    promisesArray.push(saveRecordReferenceInRelatedObjects1to1(allRelationObjectsArray1to1,
      ast, authentication));
  }
  if (allRelationObjectsArray1toM.length) {
    promisesArray.push(saveRecordReferenceInRelatedObjects1toM(allRelationObjectsArray1toM,
      ast, authentication));
  }
  return Promise.all(promisesArray);
};
export { saveRecordReferenceInRelatedObjects };
