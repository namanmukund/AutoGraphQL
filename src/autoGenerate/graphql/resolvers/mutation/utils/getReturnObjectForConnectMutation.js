// return return object which has data for both types
const getReturnObjectForConnectMutation = (values, typeName, typeField, typeId,
  relatedType, relatedTypeField, relatedTypeId) => {
  const returnObject = {};

  values.forEach((value) => {
    if (value && value.id === typeId) {
      returnObject[`${relatedTypeField}${typeName}`] = value;
    } else if (value && value.id === relatedTypeId) {
      returnObject[`${typeField}${relatedType}`] = value;
    }
  });
  return returnObject;
};
export { getReturnObjectForConnectMutation };
