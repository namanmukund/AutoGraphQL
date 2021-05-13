import validateAuthentication from '../../../../../../utils/validateAuthentication';

/*
This is called when mentor tries to crate his sessions in bulk
*/
const addBulkMentorSessionMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  // work in progress
  const { userId, courseId, timeTableRule } = params;
  console.log('--------------------------------userId', userId);
  console.log('--------------------------------courseId', courseId);
  console.log('--------------------------------timeTableRule', timeTableRule);
  return [];
};

export default addBulkMentorSessionMutationResolver;
