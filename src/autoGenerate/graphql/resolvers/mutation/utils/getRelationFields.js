// returns fields which have relation directive
import isFieldDirectivePresent from '../../../../utils/isFieldDirectivePresent';
import getDirectiveArgumentValue from '../../../../utils/getDirectiveArgumentValue';
/*
relationFieldsArray: [ { fieldName: 'learningObjective',
  fieldType: { dataType: 'LearningObjective' },
  fieldValue: { order: 23, title: 'fsfsfsdsdfsfs' },
  relationName: 'LearningObjectiveDump' }
  ]
 */
const getRelationFields = (input, ast, typeName) => {
  const relationFieldsArray = [];

  Object.keys(input)
    .forEach((fieldName) => {
      if (isFieldDirectivePresent(ast, typeName, fieldName, 'relation')) {
        const fieldType = ast[typeName].field[fieldName].type;
        const fieldValue = input[fieldName];
        const relationName = getDirectiveArgumentValue(ast, typeName, fieldName, 'relation', 'name');
        const relationFieldsObj = { fieldName, fieldType, fieldValue, relationName };
        relationFieldsArray.push(relationFieldsObj);
      }
    });
  return relationFieldsArray;
};
export { getRelationFields };
