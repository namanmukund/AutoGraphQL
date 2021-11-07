import { MutationController } from '../../../controllers';
import { generateCuid } from '../../../../../../utils';
import { FileUploadConnectionFailedError } from '../../../../../../constants/errors/db';
// resolver for file upload
const connectFileWithTheGivenType = (params, authentication, fileId) => {
  const { connectInput } = params;
  if (!connectInput || !connectInput.type || !connectInput.typeId || !connectInput.typeField) {
    return Promise.resolve();
  }
  const { type, typeId, typeField } = connectInput;
  const modelMutations = new MutationController(type, authentication);
  const updateObj = {
    [`${typeField}`]: {
      type: 'File',
      typeId: fileId,
    },
  };
  return modelMutations.update({ id: typeId }, updateObj);
};
const uploadFileResolver = (root, params, authentication, context) => {
  const typeName = 'File';
  const modelMutations = new MutationController(typeName, authentication);
  const { filePayload: { action } } = context;
  const { fileInput } = params;
  if (action === 'edit') {
    const { filePayload: { data: { id } } } = context;
    return modelMutations.updateDocument(id, fileInput);
  }

  const fileWithId = generateCuid(fileInput);
  let usageCount = 1;
  const { connectInput } = params;
  if (!connectInput || !connectInput.type || !connectInput.typeId || !connectInput.typeField) {
    usageCount = 0;
  }
  Object.assign(fileWithId, { usageCount });
  return modelMutations.addDocument(fileWithId).then(async (res) => {
    const { id: fileId } = res;
    return connectFileWithTheGivenType(params, authentication, fileId)
      .then((typeData) => {
        if (typeData && !typeData.nModified) {
          throw new FileUploadConnectionFailedError();
        }
        return res;
      });
  });
};

export default uploadFileResolver;
