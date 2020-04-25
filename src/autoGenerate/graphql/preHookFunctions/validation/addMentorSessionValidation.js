import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../utils';
import { RelationValuesExistError, UserMismatchError } from '../../../../../constants/errors';
import { backendApps, slotTimes } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import { ADMIN } from '../../../../../constants/roles';

const getSlotTimesInString = () => {
  let slotTimesInString = '';
  slotTimes.forEach((slot) => {
    slotTimesInString += `${slot} `;
  });
  return slotTimesInString;
};
// query to get mentor Sessions
const PRE_BOOKING_HOUR_LIMIT = 0;
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

// validate mentor session input variables
const validateMentorSessionInput = (params) => {
  console.log(333333, params);
  const { input } = params;
  const { availabilityDate, ...slots } = input;
  let latestSlotTime = '';
  Object.keys(slots).forEach((slot) => {
    if (slot.includes('slot')) {
      if (slots[slot]) {
        latestSlotTime = slot.toString().split('slot')[1];
      }
    }
  });

  if (!latestSlotTime) {
    throw new Error('No slots selected');
  }

  const date = new Date(availabilityDate);
  const currentDate = new Date();

  // if date is same check for hours
  if (date.getDate() === currentDate.getDate()
    && date.getMonth() === currentDate.getMonth()
    && date.getFullYear() === currentDate.getFullYear()
    && latestSlotTime <= (Math.floor(currentDate.getHours()) + PRE_BOOKING_HOUR_LIMIT)
  ) {
    throw new Error("Can't book for past hours");
  }
  // if date belongs to the past
  if (date.setHours(0, 0, 0, 0) < currentDate.setHours(0, 0, 0, 0)) {
    throw new Error("Can't book for past");
  }

  return true;
};
// prehook logic to check if added MentorSession(user id and availabilityDate) already exists
const addMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  validateMentorSessionInput(params);
  console.log(566665656, params);
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
