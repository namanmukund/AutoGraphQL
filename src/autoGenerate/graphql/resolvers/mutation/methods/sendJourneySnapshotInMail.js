import { sendJourneySnapshotInMailMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const sendJourneySnapshotInMail = async (root, params, context, info) => {
  const typeName = 'sendJourneySnapshotInMail';
  const mutationName = 'sendJourneySnapshotInMail';
  const { parsedASTMap } = context;

  return sendJourneySnapshotInMailMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default sendJourneySnapshotInMail;
