import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { MutationController } from '../../../controllers';

const rebookMenteeSessionMutationResolver = async (
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

  context.parentComponent = 'rebookMenteeSession';

  const modelQuery = new MutationController('MenteeSession', { bypass: true });
  const modelQueryRes = await modelQuery.updateDocument(input.menteeSessionId, { ...input });

  return modelQueryRes;
};

export default rebookMenteeSessionMutationResolver;
