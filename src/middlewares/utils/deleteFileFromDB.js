import { MutationController } from '../../autoGenerate/graphql/controllers';

const deleteFileFromDB = (typeId) => {
  const mutationController = new MutationController('File', { bypass: true });
  return mutationController.deleteDocument(typeId);
};

export default deleteFileFromDB;
