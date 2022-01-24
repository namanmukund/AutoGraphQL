import { get } from 'lodash';
import { UnauthenticatedUserError } from '../../../../../../constants/errors';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { getFieldsBeingFetched } from '../../../../utils';
import { validateIncomingFields } from '../../../../utils/getFlatArrayForFields';
import { getUserIdandAppNameAfterValidation } from '../../../preHookFunctions/validation/utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getSpeakers = async (eventId) => {
  const query = `{
  eventSpeakerProfiles(filter: { events_some: { id: "${eventId}" } }) {
    id
    linkedInLink
    roleAtOrganization
    organization
    about
    user {
      id
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventSpeakerProfiles', []);
};

const getEventSpeaker = (async (root, params, context, info) => {
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
  const speakers = await getSpeakers(get(params, 'eventId'));
  const speakersResponse = [];
  if (speakers && speakers.length) {
    speakers.forEach((speaker) => {
      speakersResponse.push({
        linkedInLink: get(speaker, 'linkedInLink'),
        roleAtOrganization: get(speaker, 'linkedInLink'),
        organization: get(speaker, 'linkedInLink'),
        about: get(speaker, 'linkedInLink'),
        user: { type: 'User', typeId: `${get(speaker, 'user.id')}` },
      });
    });
  }
  return speakersResponse;
});

export default getEventSpeaker;
