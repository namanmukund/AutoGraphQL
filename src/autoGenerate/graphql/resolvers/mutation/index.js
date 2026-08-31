import addMutationResolver from './add/add';
import deleteMutationResolver from './delete/delete';
import deleteMultipleMutationResolver from './delete/deleteMany';
import updateMutationResolver from './update/update';
import addRelationMutationResolver from './add/addRelation';
import removeRelationMutationResolver from './delete/removeRelation';

export {
  addMutationResolver,
  updateMutationResolver,
  deleteMutationResolver,
  deleteMultipleMutationResolver,
  addRelationMutationResolver,
  removeRelationMutationResolver,
};
