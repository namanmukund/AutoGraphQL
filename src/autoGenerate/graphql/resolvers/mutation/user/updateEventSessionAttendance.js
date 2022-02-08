import { get } from 'lodash';
import { TWA } from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { MutationController, QueryController } from '../../../controllers';
import eventsLSQActions from '../../../postHookFunctions/utils/eventsLSQActions';

const EVENTSESSION_TYPE = 'EventSession';

const EVENTCERTIFICATE_TYPE = 'EventCertificate';

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

const updateEventSessionAttendanceMutationResolver = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params;
  const currentUser = authentication && authentication.user;
  validateAuthentication(context);
  const appName = authentication && authentication.app;
  if (get(appName, 'name') !== TWA) {
    return {
      result: true,
    };
  }
  const { eventId, eventSessionId, studentProfileId } = input;
  if (!eventId || !eventSessionId || !studentProfileId) {
    throw new MissingMandatoryInputInRequestError();
  }
  const modelQueries = new QueryController(EVENTSESSION_TYPE, authentication);
  modelQueries.fetchOne({ id: eventSessionId }).then((res) => {
    if (!res) throw new DatabaseRecordNotFoundError();
    const attendance = get(res, 'attendance', []);
    const alreadyAdded = attendance.find((attendee) => get(attendee, 'student.typeId') === studentProfileId);
    if (alreadyAdded) {
      return {
        result: true,
      };
    }
    attendance.push({ student: { typeId: studentProfileId, type: 'StudentProfile' }, isPresent: true });
    const updateAttendanceModal = new MutationController(EVENTSESSION_TYPE, authentication);
    updateAttendanceModal.updateOne({ id: eventSessionId }, {
      attendance,
    });
    const certificateQuery = new QueryController(EVENTCERTIFICATE_TYPE, authentication);
    certificateQuery.fetchOne({
      'event.typeId': eventId,
      'user.typeId': currentUser.id,
    }).then((certificate) => {
      if (!certificate) {
        generateEventCertificate(currentUser.id, eventId);
        eventsLSQActions(eventId, studentProfileId, 'eventCompletion');
      }
    });
    return {
      result: true,
    };
  });
  return {
    result: true,
  };
};

export default updateEventSessionAttendanceMutationResolver;
