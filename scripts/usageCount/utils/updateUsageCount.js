import { MutationController } from '../../../src/autoGenerate/graphql/controllers';
// the function takes fileId and the usageCount received from all the relations before the update
const updateUsageCount = (fileId, usageCount) => {
  const newAuthentication = {
    bypass: true,
  };
  const query = {
    id: fileId,
  };
  const updateObj = {
    $set: {
      usageCount,
    },
  };
  const modelMutation = new MutationController('File', newAuthentication);
  return modelMutation.update(query, updateObj);
};

export default updateUsageCount;
