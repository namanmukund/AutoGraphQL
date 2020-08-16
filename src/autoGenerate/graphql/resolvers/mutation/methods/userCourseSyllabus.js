import { prehook } from '../../../preHook';
import { userCourseSyllabusMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const userCourseSyllabus = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userCourseSyllabus';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);

  return userCourseSyllabusMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default userCourseSyllabus;
