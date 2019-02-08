import { MutationController } from '../../../controllers';
import { DatabaseRecordNotFoundError, FileUploadError } from '../../../../../../constants/errors';
import { generateCuid } from '../../../../../../utils';
// resolver for file upload
const connectFileWithTheGivenType = (params, authentication, fileId) => {
  const { connectType, connectTypeId, connectTypeField } = params;
  const modelMutations = new MutationController(connectType, authentication);
  const updateObj = {
    [`${connectTypeField}`]: {
      type: 'File',
      typeId: fileId,
    },
  };
  return modelMutations.update({ id: connectTypeId }, updateObj);
};
const uploadFileResolver = (root, params, authentication) => {
  const typeName = 'File';
  const modelMutations = new MutationController(typeName, authentication);
  const { file } = params;
  if (!file) {
    throw new FileUploadError();
  }

  const fileWithId = generateCuid(file);
  return modelMutations.addDocument(fileWithId).then(async (res) => {
    const { id: fileId } = res;
    return connectFileWithTheGivenType(params, authentication, fileId)
      .then((typeData) => {
        if (!typeData.nModified) {
          throw new DatabaseRecordNotFoundError();
        }
        return res;
      });
  });
};

export default uploadFileResolver;
