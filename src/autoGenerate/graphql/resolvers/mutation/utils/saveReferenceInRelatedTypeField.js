// saves reference in the related type in field with the relation
import updateAndIncreaseUsageCountInFile from './updateAndIncreaseUsageCountInFile';
import MutationController from '../../../controllers/MutationController';
import QueryController from '../../../controllers/QueryController';
import getDirectiveArgumentValue from '../../../../utils/getDirectiveArgumentValue';
import relationDirections from '../../../../../../constants/relations';
import findFieldWithTheRelation from '../../../../utils/findFieldWithTheRelation';
import { BiDirectionalRelationsRequiredError } from '../../../../../../constants/errors';

export const saveReferenceInRelatedTypeField = async (relationObject, ast, authentication) => {
  // saved record type
  const {
    type: { relatedSchemaType },
    recordId,
    recordType,
    field,
    relationName,
    direction,
    updateOperationType,
  } = relationObject;
  if (relatedSchemaType === 'File') {
    await updateAndIncreaseUsageCountInFile(relationObject.typeId, authentication);
  }

  const relatedModelMutations = new MutationController(relatedSchemaType, { bypass: true });
  const relatedModelQueries = new QueryController(relatedSchemaType, { bypass: true });
  const typeFields = ast[relatedSchemaType] && ast[relatedSchemaType].fields;
  if (!typeFields || !typeFields.length) {
    return null;
  }

  // if relation is one way then dont save reference in related type
  const relationDirection = direction || getDirectiveArgumentValue(
    ast,
    recordType,
    field,
    'relation',
    'direction',
  );
  if (relationDirection === relationDirections.oneWay) {
    return null;
  }
  // find field with the relation in related type
  const fieldWithRelation = findFieldWithTheRelation(
    relatedSchemaType,
    relationName,
    ast,
  );
  // if relation not found in any of the type fields return error
  if (!fieldWithRelation) {
    throw new BiDirectionalRelationsRequiredError();
  }
  // is field list
  const isFieldListType = !!ast[relatedSchemaType].field[fieldWithRelation].type.isList;
  // make relation object
  const fieldRelationObject = {
    typeId: recordId,
    type: recordType,
  };
  const searchObject = { id: relationObject.typeId };
  let updateObject;


  let isReferencePresent = false;
  const referencedRecord = await relatedModelQueries.fetchById(relationObject.typeId);
  if (isFieldListType) {
    // check if relation object doesnt already exist in the referenced record;
    if (referencedRecord[fieldWithRelation] && referencedRecord[fieldWithRelation].length) {
      for (let i = 0; i < referencedRecord[fieldWithRelation].length; i += 1) {
        if (referencedRecord[fieldWithRelation][i].typeId === recordId) {
          isReferencePresent = true;
        }
      }
    }

    // make update object
    updateObject = { $addToSet: {} };
    updateObject.$addToSet[fieldWithRelation] = fieldRelationObject;
  } else {
    // if field not a list type case
    // check if relation object doesnt already exist in the referenced record;
    if (referencedRecord[fieldWithRelation] &&
      referencedRecord[fieldWithRelation].typeId === recordId) {
      isReferencePresent = true;
    }
    // make update object
    updateObject = { $set: {} };
    updateObject.$set[fieldWithRelation] = fieldRelationObject;
  }
  if (isReferencePresent) {
    return null;
  }
  // query call for adding relation in reference key
  return relatedModelMutations
    .updateOne(searchObject, updateObject);
};
