import { MutationController } from '../../../controllers';

const removeBatchesFromStudentMutationResolver = async (
  root,
  params,
) => {
  const { studentProfileId } = params;
  const newAuthentication = {
    bypass: true,
  };
  const query = {
    id: studentProfileId,
  };
  const updateObj = {
    $set: {
      batches: [],
    },
  };
  const modelMutation = new MutationController('StudentProfile', newAuthentication);
  await modelMutation.update(query, updateObj).then((res) => console.log({ res: JSON.stringify(res) }));
  return true;
};
export default removeBatchesFromStudentMutationResolver;
