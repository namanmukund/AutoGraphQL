import { toObject } from '../../../../utils';

const addAdditionalRelationFieldsToResponse = (relationValueWithAdditionalRelationFields,
  relationValueFromDB) => {
  const appendedRelationsArray = relationValueFromDB.map((dbValue) => {
    if (!dbValue) {
      return null;
    }
    const relationDocument = toObject(dbValue);
    const { id } = relationDocument;
    relationValueWithAdditionalRelationFields.forEach((value) => {
      if (value.typeId === id) {
        const relationValue = toObject(value);
        const allKeys = Object.keys(relationValue);
        allKeys.forEach((key) => {
          if (key !== 'type' && key !== 'typeId') {
            relationDocument[key] = relationValue[key];
          }
        });
      }
    });
    return relationDocument;
  });

  return appendedRelationsArray;
};

export default addAdditionalRelationFieldsToResponse;
