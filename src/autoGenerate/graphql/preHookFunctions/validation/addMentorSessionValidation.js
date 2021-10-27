import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import {
  UserMismatchError, LateToAcceptRequest,
  NotBroadcastedMentor, SlotAlreadyFilled, SlotAlreadyOpened,
} from '../../../../../constants/errors';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { ADMIN, SALES_EXECUTIVE, UMS_ADMIN } from '../../../../../constants/roles';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import checkIfSlotCanBeOpenedValidation from './utils/checkIfSlotCanBeOpenedValidation';
import fetchMentorAvailabilitySlot, { fetchMentorSessionsForSlot } from './utils/mentorAvailabilityQueries/fetchMentorAvailabilitySlot';
import getMentorSessions from '../../../utils/getMentorSessions';

const getMentorProfile = async (mentorId) => {
  const query = `{
  mentorProfiles(filter: { user_some: { id: "${mentorId}" } }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.mentorProfiles', []);
};

// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  /*
  Calling method to validate token and return userId and appName
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */

  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  if (get(params, 'input.acceptanceObjects', []).length > 0) {
    const {
      mentorAvailabilitySlotId, slotName, date, menteeSessionId,
    } = get(params, 'input.acceptanceObjects[0]', {});
    const time = slotName.split('slot')[1];
    const mentorId = get(params, 'userConnectId');
    const mentorProfile = await getMentorProfile(mentorId);
    const mentorProfileId = get(mentorProfile, '[0].id');
    if (mentorAvailabilitySlotId && !menteeSessionId) {
      const mentorAvailabilitySlot = await fetchMentorAvailabilitySlot(mentorAvailabilitySlotId);
      const broadCastedMentorsId = get(mentorAvailabilitySlot, 'broadCastedMentors', []).map((mentor) => get(mentor, 'id'));
      const startTime = moment(date).set('hours', time);
      const dateValue = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
      if (!broadCastedMentorsId.includes(mentorProfileId)) {
        throw new NotBroadcastedMentor();
      }
      if (!moment().isBefore(startTime)) {
        throw new LateToAcceptRequest();
      }
      if (get(mentorAvailabilitySlot, 'count', 0) <= get(mentorAvailabilitySlot, 'mentorSessionsMeta.count', 0)) {
        throw new SlotAlreadyFilled();
      }
      const mentorSessionsOfSlot = await fetchMentorSessionsForSlot({ date: dateValue, mentorId, slotNumber: time });
      if (mentorSessionsOfSlot && mentorSessionsOfSlot.length > 0) {
        throw new SlotAlreadyOpened();
      }
    }
  }
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;

  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);

  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;
  context.appName = appName;

  // validate input before proceeding
  validateMentorSessionInput(params, '', context);
  // check if the document for called user and availabilityDate is already present
  const userId = get(params, 'userConnectId');
  // courseId not mandatory for mentorSession
  // const courseId = get(params, 'courseConnectId');
  const availabilityDate = get(params, 'input.availabilityDate');

  // log in case user id or availabilityDate is not present
  if (!userId || !availabilityDate) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either userConnectId or availabilityDate or all missing in input',
      },
    });
  }

  if (
    !backendApps.includes(appName)
    && userIdFromContext !== userId
    && !(userRoleFromContext === ADMIN || userRoleFromContext === UMS_ADMIN || userRoleFromContext === SALES_EXECUTIVE)
  ) {
    throw new UserMismatchError();
  }

  const sessionType = get(params, 'input.sessionType') || 'trial';
  // throw error if document already exists
  const getMentorSessionsRes = await callLocalGraphqlApi(
    getMentorSessions(
      userId,
      availabilityDate,
    ),
  );

  // there can be a max of 3 mentorSessions for an availability date of type(batch/trial/paid)
  // first we will check that only one sessionType exits for one availability day
  // second we will check that slot which is being sent true in not already booked for other type
  const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
  // if once session created for a day then just update the session
  if (mentorSessions && mentorSessions.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorSession of mentorSessions) {
      if (mentorSession.sessionType === sessionType) {
        throw new SimilarDocumentAlreadyExistError();
      }
    }
  }
  checkIfSlotCanBeOpenedValidation(params, mentorSessions);
  return true;
};

export default addMentorSessionValidation;
