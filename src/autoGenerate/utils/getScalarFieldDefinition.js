const getScalarFieldDefinition = (fieldType) => {
  let fieldModelDefinition;
  switch (fieldType) {
    case 'ID': {
      fieldModelDefinition = { type: 'String' };
      break;
    }
    case 'Int': {
      fieldModelDefinition = { type: 'Number' };
      break;
    }
    case 'Float': {
      fieldModelDefinition = { type: 'Number' };
      break;
    }
    case 'String': {
      fieldModelDefinition = { type: 'String' };
      break;
    }
    case 'Boolean': {
      fieldModelDefinition = { type: 'Boolean' };
      break;
    }
    default: {
      fieldModelDefinition = { type: fieldType };
    }
  }

  return fieldModelDefinition;
};

export default getScalarFieldDefinition;
