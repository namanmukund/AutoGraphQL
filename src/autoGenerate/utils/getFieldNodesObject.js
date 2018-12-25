import getFieldNodeObject from './getFieldNodeObject';

// Gets the fields requested during graphql query/mutaiton,
// in object form.
const getFieldNodesObject = fieldNodes =>
  fieldNodes.map(fieldNode => getFieldNodeObject(fieldNode));

export default getFieldNodesObject;
