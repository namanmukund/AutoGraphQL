/* replace type field from something like this to
{
  "kind": "NamedType",
  "name": {
    "kind": "Name",
    "value": "Int",
    "loc": {
      "start": 33,
      "end": 36
    }
  },
  "loc": {
    "start": 33,
    "end": 36
  }
}
to type
{
  "dataType": "Int"
}
 */
const getParsedField = (field) => {
  const fieldObject = Object.assign({}, field);
  const finalFieldObject = Object.assign({}, field);
  delete finalFieldObject.type;
  const fieldType = {};
  while (fieldObject.type) {
    switch (fieldObject.type.kind) {
      case 'NonNullType': {
        switch (fieldType.isList) {
          case true: {
            fieldType.isListIsNonNull = true;
            break;
          }
          default: {
            fieldType.isNonNull = true;
          }
        }
        break;
      }
      case 'ListType': {
        fieldType.isList = true;
        break;
      }
      case 'NamedType': {
        fieldType.dataType = fieldObject.type.name.value;
        break;
      }
      /* no default */
    }
    fieldObject.type = fieldObject.type.type;
  }
  finalFieldObject.type = fieldType;
  return finalFieldObject;
};

export default getParsedField;
