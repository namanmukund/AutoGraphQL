const getRelationMutationNames = (relationName) => {
  const addToRelationMutation = `addTo${relationName}`;
  const removeFromRelationMutation = `removeFrom${relationName}`;
  return { addToRelationMutation, removeFromRelationMutation };
};

export default getRelationMutationNames;
