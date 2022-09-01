import { prehook } from '../../../preHook';
import { toObject } from '../../../../../../utils';
import removeBatchStudentsMutationResolver from '../userData/removeBatchStudents';

const removeBatchStudents = async (root, params, context, info) => {
  const typeName = 'RemoveBatchStudentsStatus';
  const mutationName = 'removeBatchStudents';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);
  return removeBatchStudentsMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default removeBatchStudents;
