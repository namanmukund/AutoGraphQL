import { MutationController } from '../../../controllers';
import { FileUploadError } from '../../../../../../constants/errors';
import { generateCuid } from '../../../../../../utils';
// resolver for file upload
const uploadFileResolver = (root, params, authentication) => {
  const typeName = 'File';
  const modelMutations = new MutationController(typeName, authentication);
  const { file } = params;
  if (!file) {
    throw new FileUploadError();
  }
  const fileWithId = generateCuid(file);
  return modelMutations.addDocument(fileWithId);
};

export default uploadFileResolver;
