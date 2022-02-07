import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, UnauthorizedOperationError } from '../../../../../constants/errors';
import {
  TWA,
} from '../../../../../constants';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';

const getCurrentUser = async (userId) => {
  const query = `{
  studentProfiles(filter: { user_some: { id: "${userId}" } }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.studentProfiles[0].id');
};

const getEventId = async (eventSessionId) => {
  const query = `{
    eventSession(id:"${eventSessionId}"){
        id
        event{
            id
        }
    }
  }`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventSession.event.id');
};

const getEventSessionDetail = async (eventSessionId) => {
  const query = `{
    eventSession(id:"${eventSessionId}"){
        id
        sessionDate
        ${getSlotTimesInString()}
    }
  }`;
  const eventSession = await callLocalGraphqlApi(query);
  return get(eventSession, 'data.eventSession');
};

const updateEventSessionValidation = async (params, input, mutationName, context) => {
  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const { id: eventSessionId } = params;
  const {
    currentUser,
    currentApp,
  } = userInfo;
  const eventId = await getEventId(eventSessionId);
  if (!eventId) {
    throw new DatabaseRecordNotFoundError();
  }
  if (get(params, 'input.attendance.updateWhere.studentReferenceId')
    && get(currentApp, 'name') === TWA) {
    const studentProfileId = await getCurrentUser(get(currentUser, 'id'));
    if (studentProfileId !== get(params, 'input.attendance.updateWhere.studentReferenceId')) {
      throw new UnauthorizedOperationError();
    }
    context.currentUserId = get(currentUser, 'id');
    context.eventId = eventId;
    context.currentApp = get(currentApp, 'name');
    context.studentProfileId = studentProfileId;
  }

  const { sessionDate, ...slots } = input;
  const slotsTime = getSelectedSlotsTime(slots);
  if (sessionDate && slotsTime.length) {
    const eventSession = getEventSessionDetail(eventSessionId);
    const { sessionDate: prevSessionDate, ...prevSlots } = eventSession;
    const prevSlotTimes = getSelectedSlotsTime(prevSlots);
    if (sessionDate !== prevSessionDate || (prevSlotTimes.length
      && get(slotsTime, '[0]') !== get(prevSlotTimes, '[0]'))) {
      context.newScheduledDate = moment(sessionDate).set('hours', get(slotsTime, '[0]')).subtract(1, 'hour');
    }
  }
  return true;
};

export default updateEventSessionValidation;
