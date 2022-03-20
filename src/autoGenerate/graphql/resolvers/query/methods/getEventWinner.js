import { get } from 'lodash';
import { UnauthenticatedUserError } from '../../../../../../constants/errors';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { getFieldsBeingFetched } from '../../../../utils';
import { validateIncomingFields } from '../../../../utils/getFlatArrayForFields';
import { getUserIdandAppNameAfterValidation } from '../../../preHookFunctions/validation/utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getEventWinners = async (eventId) => {
  const query = `{
  eventWinners(filter: { event_some: { id: "${eventId}" } }) {
    studentProfile {
      user {
        id
        profilePic {
          id
          uri
        }
      }
    }
    image {
      id
      uri
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventWinners', []);
};

const getEventWinner = (async (root, params, context, info) => {
  // getting input from params
  if (!get(params, 'eventId')) {
    throw new MissingMandatoryInputInRequestError();
  }
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  validateAuthentication(context, 'app');
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  context.currentUser = true;
  const {
    userIdFromContext,
  } = userAndAppInfo;
  if (!userIdFromContext) {
    if (get(fieldsFetched, 'user')) {
      const isValidField = await validateIncomingFields(get(fieldsFetched, 'user'), ['profilePic', 'name', 'id', 'profilePic.uri']);
      if (isValidField) {
        throw new UnauthenticatedUserError();
      }
    }
  }
  const winners = await getEventWinners(get(params, 'eventId'));
  const winnersResponse = [];
  if (winners && winners.length) {
    winners.forEach((winner) => {
      let picture = '';
      if (get(winner, 'image.id')) {
        picture = { type: 'File', typeId: `${get(winner, 'image.id')}` };
      } else if (get(winner, 'studentProfile.user.profilePic.id')) {
        picture = { type: 'File', typeId: `${get(winner, 'studentProfile.user.profilePic.id')}` };
      }
      winnersResponse.push({
        profilePic: picture,
        user: { type: 'User', typeId: `${get(winner, 'studentProfile.user.id')}` },
      });
    });
  }
  return winnersResponse;
});

export default getEventWinner;
