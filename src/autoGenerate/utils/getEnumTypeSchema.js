// returns schema map for additional fields
const getEnumTypeSchema = (fieldDefinition, enumArray) => {
  const enumInfo = Object.keys(fieldDefinition)
    .indexOf('default') < 0 ? {
      type: 'String', enum: enumArray,
    } :
    {
      type: 'String',
      enum: enumArray,
      default: fieldDefinition.default,
    };

  return enumInfo;
};

export default getEnumTypeSchema;
