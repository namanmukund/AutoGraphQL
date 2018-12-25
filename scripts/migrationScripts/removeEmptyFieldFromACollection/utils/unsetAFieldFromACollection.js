import { MutationController } from '../../../../src/autoGenerate/graphql/controllers';

const unsetAFieldFromACollection = (targetedId, targetedCollection, targetedField) => {
  const query = {
    id: targetedId,
  };
  const updateObj = {
    $unset: {
      [targetedField]: 1,
    },
  };
  const newAuthentication = {
    bypass: true,
  };
  const modelMutations = new MutationController(targetedCollection, newAuthentication);
  return modelMutations.update(query, updateObj);
};

export default unsetAFieldFromACollection;
