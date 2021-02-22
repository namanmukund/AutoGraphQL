import fetchUserApprovedCodeTag from './utils/fetchUserApprovedCodeTag';
import updateUserApprovedCodeTag from './utils/updateUserApprovedCodeTag';

const deleteUserApprovedCodeTagMappingPostHookMethod = async (input) => {
  const { userApprovedCodeTag } = input;
  const { typeId: userApprovedCodeTagId } = userApprovedCodeTag;
  const userApprovedCodeTagData = await fetchUserApprovedCodeTag(userApprovedCodeTagId);
  await updateUserApprovedCodeTag(userApprovedCodeTagId, { codeCount: userApprovedCodeTagData.codeCount - 1 });
  return true;
};

export default deleteUserApprovedCodeTagMappingPostHookMethod;
