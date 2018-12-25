import { MutationController } from '../../../src/autoGenerate/graphql/controllers';
// To avoid any ambiguity, this function update usageCount field to zero in file before proceeding
const updateUsageCountToZeroInFile = () => {
  const newAuthentication = {
    bypass: true,
  };
  const query = {};
  const updateObj = {
    $set: {
      usageCount: 0,
    },
  };
  const multipleObj = true;
  const modelMutation = new MutationController('File', newAuthentication);
  return modelMutation.update(query, updateObj, multipleObj);
};

export default updateUsageCountToZeroInFile;
