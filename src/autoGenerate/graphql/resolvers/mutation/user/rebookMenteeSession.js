import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { MutationController } from '../../../controllers';

const updateMenteeSession = async (id, bookingDate, slot) => `
  mutation {
    updateMenteeSession(id:"${id}"
    input: {
      bookingDate: "${bookingDate}",
      slot${slot}: true,
    }){
      id
      course{
        id
      }
    }
  }
`;

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
