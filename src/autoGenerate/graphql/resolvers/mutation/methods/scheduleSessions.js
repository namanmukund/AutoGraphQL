import { scheduleSessionsMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const scheduleSessions = async (root, params, context, info) => {
  const typeName = 'scheduleSessions';
  const mutationName = 'scheduleSessions';
  const { parsedASTMap } = context;

  return scheduleSessionsMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default scheduleSessions;
