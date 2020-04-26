import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../utils';
import { RelationValuesExistError, UserMismatchError } from '../../../../../constants/errors';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { ADMIN } from '../../../../../constants/roles';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';


// query to get mentor Sessions
const getMentorSessions = (userId, availabilityDate) => `
  query{
    mentorSessions(filter:{
      and:[
         {user_some: {
          id: "${userId}"
        }},
        {
          availabilityDate: "${availabilityDate}"
        }
      ]
    }){
      id
      ${getSlotTimesInString()}
    }
  }
  `;
// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  // validate input before proceeding
  validateMentorSessionInput(params);
  // check if the document for called user and availabilityDate is already present
  const userId = get(params, 'userConnectId');
  const availabilityDate = get(params, 'input.availabilityDate');

  // log in case user id or availabilityDate is not present
  if (!userId || !availabilityDate) {
    log('Either one of userId or availabilityDate is missing in params of addMentorSessionValidation');
  }

  if (userId && availabilityDate) {
    /*
    Calling method to validate token and return userId and appName
    we will compare this userId against userId passed in input
    both should be equal to perform further action
    */

    // getting user role from context. We will allow adding mentorSession if logged in user is admin
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

    if (!backendApps.includes(appName) && userIdFromContext !== userId && userRoleFromContext !== ADMIN) {
      throw new UserMismatchError();
    }

    // throw error if document already exists
    const getMentorSessionsRes = await callLocalGraphqlApi(getMentorSessions(userId, availabilityDate));
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    // if once session created for a day then just update the session
    if (mentorSessions && mentorSessions.length) {
      throw new RelationValuesExistError();
    }
  }

  return true;
};

export default addMentorSessionValidation;
