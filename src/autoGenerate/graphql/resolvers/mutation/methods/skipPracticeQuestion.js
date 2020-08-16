import { prehook } from '../../../preHook';
import { skipPracticeQuestionMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const skipPracticeQuestion = async (root, params, context, info) => {
  const typeName = 'SkipPracticeQuestion';
  const mutationName = 'skipPracticeQuestion';

  const hookInput = await prehook(params, mutationName, context, params);

  return skipPracticeQuestionMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
    params,
  ).then((result) => toObject(result));
};

export default skipPracticeQuestion;
