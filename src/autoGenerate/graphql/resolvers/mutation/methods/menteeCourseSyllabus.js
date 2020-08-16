import { prehook } from '../../../preHook';
import { menteeCourseSyllabusMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const menteeCourseSyllabus = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'menteeCourseSyllabus';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);
  return menteeCourseSyllabusMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default menteeCourseSyllabus;
