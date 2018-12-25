// rollbacks saved docs in db on error
import MutationController from '../../../controllers/MutationController';

const rollBackDocumentSaves = (savedDocs, authentication) => {
  if (savedDocs) {
    savedDocs.forEach((doc) => {
      const { type, typeId } = doc;
      const modelMutations = new MutationController(type, authentication);
      modelMutations.deleteDocument(typeId)
        .catch(error => error);
    });
  }
};
export { rollBackDocumentSaves };
