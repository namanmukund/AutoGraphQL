import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';

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
  const { id, input: { bookingDate, ...slots } } = params;
  const selectedSlot = getSelectedSlotsTime(slots);
  console.log(selectedSlot);

  context.parentComponent = 'rebookMenteeSession';

  const updateMenteeSessionRes = await callLocalGraphqlApi(updateMenteeSession(id, bookingDate, selectedSlot[0]), context);
  console.log(updateMenteeSessionRes);
  return {
    result: true,
  };
};

export default rebookMenteeSessionMutationResolver;
