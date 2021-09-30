import validateAuthentication from '../../../../../../utils/validateAuthentication';

const generateJourneySnapshotMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);
  const { input } = params;

  return input;
};

export default generateJourneySnapshotMutationResolver;
