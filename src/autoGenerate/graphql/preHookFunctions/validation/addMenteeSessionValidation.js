import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { UserMismatchError } from '../../../../../constants/errors';
import { ADMIN, UMS_ADMIN, MENTOR, SALES } from '../../../../../constants/roles';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import validateMenteeSessionInput from './utils/validateMenteeSessionInput';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import isTrialSession from '../../resolvers/utils/isTrialSession';

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
  context.isTrialSession = await isTrialSession(topicId);

  // log in case user or topic id is not present
  if (!userId || !topicId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either userConnectId or topicConnectId or courseId or all missing in input',
      },
    });
  }

  // validate input
  await validateMenteeSessionInput(params, context);

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

  if (
    !backendApps.includes(appName)
    && userIdFromContext !== userId
    && !(userRoleFromContext === ADMIN || userRoleFromContext === UMS_ADMIN
     || userRoleFromContext === MENTOR || userRoleFromContext === SALES)
  ) {
    throw new UserMismatchError();
  }

  // throw error if document already exists
  const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, topicId));
  const menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');
  if (menteeSessions && menteeSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
  return true;
};

export default addMenteeSessionValidation;
