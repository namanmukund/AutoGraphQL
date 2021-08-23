import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { QueryController } from '../../../controllers';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import { log } from '../../../../../../utils';

const updateMenteeSession = (id, bookingDate, slot, unSelectedSlot) => `
  mutation {
    updateMenteeSession(id:"${id}"
    input: {
      bookingDate: "${bookingDate}",
      slot${slot}: true,
      slot${unSelectedSlot}: false,
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
  const { input: { menteeSessionId, bookingDate, ...slots } } = params;

  context.parentComponent = 'rebookMenteeSession';
  const selectedSlot = getSelectedSlotsTime(slots);
  const unSelectedSlot = getSelectedSlotsTime(slots, 'falseOnly');
  try {
    await callLocalGraphqlApi(updateMenteeSession(menteeSessionId, bookingDate, selectedSlot[0], unSelectedSlot[0]), context);
  } catch (err) {
    log(err);
  }

  const modelQuery = new QueryController('MenteeSession', { bypass: true });
  const modelQueryRes = await modelQuery.fetchById(menteeSessionId);

  return modelQueryRes;
};

export default rebookMenteeSessionMutationResolver;
