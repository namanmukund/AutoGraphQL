import fetchUserApprovedCodeTag from './utils/fetchUserApprovedCodeTag';
import updateUserApprovedCodeTag from './utils/updateUserApprovedCodeTag';

const deleteUserApprovedCodeTagMappingPostHookMethod = async (input, mutationName, context) => {
  const { userApprovedCodeTag } = input;
  const { typeId: userApprovedCodeTagId } = userApprovedCodeTag;
  const userApprovedCodeTagData = await fetchUserApprovedCodeTag(userApprovedCodeTagId, context);
  await updateUserApprovedCodeTag(userApprovedCodeTagId, { codeCount: userApprovedCodeTagData.codeCount - 1 }, context);
  return true;
};

export default deleteUserApprovedCodeTagMappingPostHookMethod;
