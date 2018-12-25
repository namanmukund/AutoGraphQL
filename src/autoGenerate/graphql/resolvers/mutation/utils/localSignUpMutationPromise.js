const localSignUpMutationPromise = (
  cuidInput,
  modelMutations,
) => modelMutations.addDocument(cuidInput);

export default localSignUpMutationPromise;
