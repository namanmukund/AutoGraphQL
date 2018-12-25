import { MutationController } from '../../../controllers';

const updateAndDecreaseUsageCountInFile = (fileId, authentication) => {
  const typeName = 'File';
  const searchObj = {
    id: fileId,
  };
  const updateObj = {
    $inc: {
      usageCount: -1,
    },
  };
  const fileModelMutation = new MutationController(typeName, authentication);
  return fileModelMutation.update(searchObj, updateObj);
};

export default updateAndDecreaseUsageCountInFile;
