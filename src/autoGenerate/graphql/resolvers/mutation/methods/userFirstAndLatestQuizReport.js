import { prehook } from '../../../preHook';
import { userFirstAndLatestQuizReportMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const userFirstAndLatestQuizReport = async (root, params, context, info) => {
  const typeName = 'UserCurrentTopicComponentStatus';
  const mutationName = 'userFirstAndLatestQuizReport';
  const { parsedASTMap } = context;

  const hookInput = await prehook(params, mutationName, context, params);

  return userFirstAndLatestQuizReportMutationResolver(
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

export default userFirstAndLatestQuizReport;
