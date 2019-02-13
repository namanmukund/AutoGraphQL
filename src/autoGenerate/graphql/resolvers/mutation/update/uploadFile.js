import { MutationController } from '../../../controllers';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { generateCuid } from '../../../../../../utils';
// resolver for file upload
const connectFileWithTheGivenType = (params, authentication, fileId) => {
  const { connectInput: { type, typeId, typeField } } = params;
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
  Object.assign(fileWithId, { usageCount: 1 });
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
