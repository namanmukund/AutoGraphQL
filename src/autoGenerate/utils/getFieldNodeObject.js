// Recursive function to convert each field request to object.
const getFieldNodeObject = (fieldNode) => {
  const selections = fieldNode.selectionSet && fieldNode.selectionSet.selections;
  if (selections) {
    const obj = {};
    selections.forEach((selection) => {
      if (selection.selectionSet) {
        obj[selection.name.value] = getFieldNodeObject(selection);
      } else {
        obj[selection.name.value] = true;
      }
    });
    return obj;
  }
  return null;
};

export default getFieldNodeObject;
