import { prehook } from '../../../preHook';
import { getQuizReportMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const getQuizReport = async (root, params, context, info) => {
  const typeName = 'GetQuizReport';
  const mutationName = 'getQuizReport';
  const { input } = params;
  const hookInput = await prehook(input, mutationName, context, params);

  return getQuizReportMutationResolver(
    root,
    hookInput,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default getQuizReport;
