import fetchUserApprovedCodeTag from './utils/fetchUserApprovedCodeTag';
import updateUserApprovedCodeTag from './utils/updateUserApprovedCodeTag';

const addUserApprovedCodeTagMappingPostHookMethod = async (input, _, context) => {
  const { userApprovedCodeTag } = input;
  const { typeId: userApprovedCodeTagId } = userApprovedCodeTag;
  const userApprovedCodeTagData = await fetchUserApprovedCodeTag(userApprovedCodeTagId, context);
  await updateUserApprovedCodeTag(userApprovedCodeTagId, { codeCount: userApprovedCodeTagData.codeCount + 1 }, context);
  return true;
};

export default addUserApprovedCodeTagMappingPostHookMethod;
