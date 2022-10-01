import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import {
  TWA,
} from '../../../../constants';
import eventsLSQActions from './utils/eventsLSQActions';
// import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';

const generateEventCertificate = async (userId, eventId, context) => {
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
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.generateCertificate');
};

const getUserCertificate = async (userId, eventId, context) => {
  const query = `{
  eventCertificates(
    filter: { and: [{ user_some: { id: "${userId}" } }, { event_some: { id: "${eventId}" } }] }
  ) {
    id
    assetUrl
  }
}
`;
  const certificate = await callLocalGraphqlApi(query, context);
  return get(certificate, 'data.eventCertificates', []).length;
};

const updateEventSessionPostHookMethod = async (input, params, mutationName, context) => {
  const {
    currentUserId, eventId, currentApp, studentProfileId,
    // newScheduledDate = false,
  } = context;
  // const { id: eventSessionId } = input;
  if (currentApp === TWA && currentUserId && eventId) {
    const userCertificate = await getUserCertificate(currentUserId, eventId, context);
    if (!userCertificate) {
      generateEventCertificate(currentUserId, eventId, context);
      eventsLSQActions(eventId, studentProfileId, 'eventCompletion');
    }
  }
  // if (newScheduledDate) {
  //   addToSchedule('eventSessionAttendance', newScheduledDate, {
  //     eventSessionId,
  //     isUpdatingEventSession: true,
  //   });
  // }
  return input;
};

export default updateEventSessionPostHookMethod;
