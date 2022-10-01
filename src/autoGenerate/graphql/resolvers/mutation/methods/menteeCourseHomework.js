import { prehook } from '../../../preHook';
import { toObject } from '../../../../../../utils';
import menteeCourseHomeworkMutationResolver from '../userData/menteeCourseHomework';

const menteeCourseHomework = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'menteeCourseHomework';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);
  return menteeCourseHomeworkMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default menteeCourseHomework;
