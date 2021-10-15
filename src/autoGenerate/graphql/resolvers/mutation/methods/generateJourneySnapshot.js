import { generateJourneySnapshotMutationResolver } from '../index';
import { toObject } from '../../../../../../utils';

const generateJourneySnapshot = async (root, params, context, info) => {
  const typeName = 'generateJourneySnapshot';
  const mutationName = 'generateJourneySnapshot';
  const { parsedASTMap } = context;

  return generateJourneySnapshotMutationResolver(
    root,
    params,
    typeName,
    info,
    mutationName,
    parsedASTMap,
    context,
  ).then((result) => toObject(result));
};

export default generateJourneySnapshot;
