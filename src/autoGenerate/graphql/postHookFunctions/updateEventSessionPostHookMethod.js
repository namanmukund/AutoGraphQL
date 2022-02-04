import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import {
  TWA,
} from '../../../../constants';
import eventsLSQActions from './utils/eventsLSQActions';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';

const generateEventCertificate = async (userId, eventId) => {
  const query = `
    mutation {
    generateCertificate(
        input: { userId: "${userId}", eventId: "${eventId}", isBulkGenerate: true }
    ) {
        id
        assetUrl
        tekieUrl
    }
    }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate');
};

const getUserCertificate = async (userId, eventId) => {
  const query = `{
  eventCertificates(
    filter: { and: [{ user_some: { id: "${userId}" } }, { event_some: { id: "${eventId}" } }] }
  ) {
    id
    assetUrl
  }
}
`;
  const certificate = await callLocalGraphqlApi(query);
  return get(certificate, 'data.eventCertificates', []).length;
};

const updateEventSessionPostHookMethod = async (input, params, mutationName, context) => {
  const {
    currentUserId, eventId, currentApp, studentProfileId,
  } = context;
  if (currentApp === TWA && currentUserId && eventId) {
    const userCertificate = await getUserCertificate(currentUserId, eventId);
    if (!userCertificate) {
      generateEventCertificate(currentUserId, eventId);
      eventsLSQActions(eventId, studentProfileId, 'eventCompletion');
    }
  }
  const { sessionDate, ...slots } = get(params, 'input');
  const slotsTime = getSelectedSlotsTime(slots);
  console.log(slotsTime, sessionDate);
  return input;
};

export default updateEventSessionPostHookMethod;
