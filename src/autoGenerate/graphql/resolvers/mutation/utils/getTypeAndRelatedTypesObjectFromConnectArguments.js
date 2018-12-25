// parses args and return argument Ids for both relatedTypes
const getTypeAndRelatedTypesObjectFromConnectArguments = (args, typeName, relatedType) => {
  const argumentKeys = Object.keys(args);
  // can have id, code, or addtnl relation fields args
  // find which argument is for type, and which for related
  let typeArgumentIndex;
  let relatedTypeArgumentIndex;
  if (argumentKeys[0].indexOf(`${typeName}Id`) >= 0) {
    typeArgumentIndex = 0;
    relatedTypeArgumentIndex = 1;
  } else {
    typeArgumentIndex = 1;
    relatedTypeArgumentIndex = 0;
  }
  // argument format:- ${relatedField}${typeName}Id
  const relatedTypeField = argumentKeys[typeArgumentIndex].split(`${typeName}Id`)[0];
  const typeField = argumentKeys[relatedTypeArgumentIndex].split(`${relatedType}Id`)[0];
  const typeId = args[argumentKeys[typeArgumentIndex]];
  const relatedTypeId = args[argumentKeys[relatedTypeArgumentIndex]];

  const relationFieldAndIdObject = { typeId, relatedTypeId, typeField, relatedTypeField };
  return relationFieldAndIdObject;
};
export { getTypeAndRelatedTypesObjectFromConnectArguments };
