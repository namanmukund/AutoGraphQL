import pluralize from 'pluralize';

const getMutationNames = (typeName) => {
  const addMutation = `add${typeName}`;
  const updateMutation = `update${typeName}`;
  const updateMultipleMutation = pluralize(updateMutation);
  const deleteMutation = `delete${typeName}`;
  const deleteMultipleMutation = pluralize(deleteMutation);
  return {
    addMutation,
    updateMutation,
    updateMultipleMutation,
    deleteMutation,
    deleteMultipleMutation,
  };
};

export default getMutationNames;
