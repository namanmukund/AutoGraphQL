import { addBulkMentorSessionMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const addBulkMentorSession = async (root, params, context, info) => {
  const typeName = 'BulkMentorSession';
  const mutationName = 'addBulkMentorSession';
  const { parsedASTMap } = context;

  return addBulkMentorSessionMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default addBulkMentorSession;
