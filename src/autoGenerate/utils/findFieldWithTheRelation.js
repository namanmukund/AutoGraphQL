// returns fieldname which has the required relation
/* connectedField agument to be used when relation is within the same type,
 it checks if the same relation field is not being returned */

const findFieldWithTheRelation = (typeName, relationName, ast, connectedField) => {
  let relationField;
  const relationFieldsForType = ast[typeName].relationFields;
  Object.keys(relationFieldsForType)
    .forEach((fieldName) => {
      const relationNameOnField = relationFieldsForType[fieldName];
      if (relationName === relationNameOnField) {
        // check for same relation field in the type doesnt get returned
        if (connectedField && fieldName === connectedField) {
          return null;
        }
        relationField = fieldName;
      }
      return null;
    });
  return relationField;
};

export default findFieldWithTheRelation;
