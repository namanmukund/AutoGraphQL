import getFieldNodesObject from './getFieldNodesObject';

const getFieldsBeingFetched = (fieldNodes) => {
  const fieldNodesObject = getFieldNodesObject(fieldNodes);
  // Taking only the first item.
  // @TODO find out why fieldNodes are array, and implement.
  return fieldNodesObject[0];
};

export default getFieldsBeingFetched;
