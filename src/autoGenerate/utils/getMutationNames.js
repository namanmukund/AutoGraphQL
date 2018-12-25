import pluralize from 'pluralize';

const getMutationNames = (typeName) => {
  const addMutation = `add${typeName}`;
  const updateMutation = `update${typeName}`;
  const deleteMutation = `delete${typeName}`;
  const deleteMultipleMutation = pluralize(deleteMutation);
  return { addMutation, updateMutation, deleteMutation, deleteMultipleMutation };
};

export default getMutationNames;
