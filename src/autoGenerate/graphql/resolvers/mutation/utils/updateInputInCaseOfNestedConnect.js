import { get } from 'lodash';
import relationDirections from '../../../../../../constants/relations';

const updateInputInCaseOfNestedConnect = (
  ast,
  typeName,
  inputFieldName,
  modifiedInput,
  arrayObjects,
  targetObj,
  mappingInfo,
) => {
  // mappingInfo to store unique mapping inside nested key
  Object.keys(targetObj).forEach((key) => {
    if (key && key.includes('ConnectId')) {
      // question
      const nestedFieldName = key.split('ConnectId')[0];
      if (!mappingInfo[nestedFieldName]) {
        // PQAttemptedQuestion
        const nestedFieldDataType = ast[typeName].field[inputFieldName].type.dataType;
        // info like type or directive
        const nestedFieldInfo = ast[nestedFieldDataType].field[nestedFieldName];
        // QuestionBank
        const nestedFieldNameRelatedTypeName = nestedFieldInfo.type.dataType;
        // direction
        const relationInfo = nestedFieldInfo.directive.relation.argument;
        const relationName = relationInfo.name.value.value;
        const direction = get(relationInfo, 'direction.value.value', relationDirections.twoWay);
        // update mappingInfo so that it can be uniquely used
        Object.assign(mappingInfo, {
          [nestedFieldName]: {
            nestedFieldDataType,
            nestedFieldNameRelatedTypeName,
            relationName,
            direction,
          },
        });
      }
      // to maintain the current structure of 1to1 and 1toM
      arrayObjects.push({
        typeId: targetObj[key],
        type: mappingInfo[nestedFieldName].nestedFieldNameRelatedTypeName,
        recordType: typeName,
        field: nestedFieldName,
        relationName: mappingInfo[nestedFieldName].relationName,
        direction: mappingInfo[nestedFieldName].direction,
        parentFieldName: inputFieldName,
      });
      // to update input with the required data
      Object.assign(modifiedInput, {
        [nestedFieldName]: {
          typeId: targetObj[key],
          type: mappingInfo[nestedFieldName].nestedFieldNameRelatedTypeName,
        },
      });
    } else {
      Object.assign(modifiedInput, { [key]: targetObj[key] });
    }
  });
  return null;
};

export default updateInputInCaseOfNestedConnect;
