import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { UnauthorizedOperationError } from '../../../../../constants/errors';
import {
  TWA,
} from '../../../../../constants';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

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
  }
  context.currentUserId = get(currentUser, 'id');
  context.eventId = eventId;
  return true;
};

export default updateEventSessionValidation;
