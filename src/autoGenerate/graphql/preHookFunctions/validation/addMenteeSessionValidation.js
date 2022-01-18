/* eslint-disable no-param-reassign */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { UserMismatchError } from '../../../../../constants/errors';
import {
  ADMIN, UMS_ADMIN, MENTOR, UMS_VIEWER, TRANSFORMATION_TEAM, TRANSFORMATION_ADMIN,
  LEAD_PARTNER,
} from '../../../../../constants/roles';
import { ALLOWED_ROLE_FOR_MANUAL_SESSIONS, backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import validateMenteeSessionInput, { getHoursDiff } from './utils/validateMenteeSessionInput';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import isTrialSession from '../../resolvers/utils/isTrialSession';
import getUserSource from './utils/getUserSource';
import updateUserSpecificDetailsInParams from './utils/updateUserSpecificDetailsInParams';
import getSelectedSlotsStringArray from '../../postHookFunctions/utils/getSelectedSlotsStringArray';

// query to get mentee Sessions
const getMenteeSessions = (userId, topicId) => `
  query{
    menteeSessions(filter:{
      and:[
         {user_some: {
          id: "${userId}"
        }},
        {
          topic_some:{
            id: "${topicId}"
          }
        }
      ]
    }){
      id
      topic{
        id
        order
      }
    }
  }
  `;

// prehook logic to check if added MenteeSession(user and topic id) is already present
const addMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  // check if the document for called user and topic is already present
  const userId = get(params, 'userConnectId');
  const topicId = get(params, 'topicConnectId');
  const courseId = get(params, 'courseConnectId');
  context.isTrialSession = await isTrialSession(topicId);

  // log in case user or topic id is not present
  if (!userId || !topicId || !courseId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either userConnectId or topicConnectId or courseId or all missing in input',
      },
    });
  }

  // getting user role from context. We will allow adding mentorSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;

  /*
    Calling method to validate token and return userId and appName
    we will compare this userId against userId passed in input
    both should be equal to perform further action
    */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;

  context.appName = appName;
  context.currentUser = currentUser;
  Object.assign(params.input, {
    bookedAt: `${new Date()}`,
  });
  if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && get(context, 'isTrialSession', false)) {
    const slotTimeStringArray = getSelectedSlotsStringArray(get(params, 'input'));
    if (slotTimeStringArray.length > 0) {
      const timeDiff = getHoursDiff(slotTimeStringArray[0].split('slot')[1], get(params, 'input.bookingDate'));
      if (timeDiff) {
        context.isManualSession = timeDiff;
      }
    }
  }
  // validate input
  await validateMenteeSessionInput(params, context, userRoleFromContext);
  const allowedRoles = [ADMIN, UMS_ADMIN, UMS_VIEWER, MENTOR, TRANSFORMATION_TEAM, TRANSFORMATION_ADMIN, LEAD_PARTNER];

  context.userIdFromContext = userIdFromContext;
  context.isBookedByMentee = userIdFromContext === userId;
  context.userRoleFromContext = userRoleFromContext;

  if (userIdFromContext === userId) {
    // eslint-disable-next-line no-param-reassign
    params.input.bookedBy = 'customer';
  } else if (userRoleFromContext === LEAD_PARTNER) {
    params.input.bookedBy = 'leadPartner';
  } else {
    params.input.bookedBy = 'tekieTeam';
  }

  if (
    !backendApps.includes(appName)
    && userIdFromContext !== userId
    && !(allowedRoles.includes(userRoleFromContext))
  ) {
    throw new UserMismatchError();
  }

  // throw error if document already exists
  const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, topicId));
  const menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');
  if (menteeSessions && menteeSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }

  // update source & country in menteeSession
  const userData = await getUserSource(userId);
  updateUserSpecificDetailsInParams(userData, params);

  return true;
};

export default addMenteeSessionValidation;
