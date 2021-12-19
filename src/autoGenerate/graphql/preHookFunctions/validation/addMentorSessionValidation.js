import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import {
  UserMismatchError,
} from '../../../../../constants/errors';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { ADMIN, SALES_EXECUTIVE, UMS_ADMIN } from '../../../../../constants/roles';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import checkIfSlotCanBeOpenedValidation from './utils/checkIfSlotCanBeOpenedValidation';
import getMentorSessions from '../../../utils/getMentorSessions';
import addAcceptedSlotRequestByMentorLogCheck from './utils/addAcceptedSlotRequestByMentorLogCheck';

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
    const mentorId = get(params, 'userConnectId');
    const mentorProfile = await getMentorProfile(mentorId);
    const mentorProfileId = get(mentorProfile, '[0].id');
    const acceptanceObjectsArray = get(params, 'input.acceptanceObjects', []);
    // eslint-disable-next-line no-restricted-syntax
    for (const acceptanceObject of acceptanceObjectsArray) {
      // eslint-disable-next-line no-await-in-loop
      await addAcceptedSlotRequestByMentorLogCheck({
        acceptanceObject, mentorProfileId, mentorId, action: 'addMentorSession',
      });
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
  const sessionType = get(params, 'input.sessionType') || 'trial';
  // validate input before proceeding
  validateMentorSessionInput(params, '', context, userRoleFromContext, sessionType);
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
