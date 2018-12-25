import { MutationController } from '../../../controllers';

const updateAndIncreaseUsageCountInFile = (fileId, authentication) => {
  const typeName = 'File';
  const searchObj = {
    id: fileId,
  };
  const updateObj = {
    $inc: {
      usageCount: 1,
    },
  };
  const fileModelMutation = new MutationController(typeName, authentication);
  return fileModelMutation.update(searchObj, updateObj);
};

export default updateAndIncreaseUsageCountInFile;
