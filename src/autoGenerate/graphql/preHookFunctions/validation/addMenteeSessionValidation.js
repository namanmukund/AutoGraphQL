import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../utils';
import { RelationValuesExistError, UserMismatchError } from '../../../../../constants/errors';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateMenteeSessionInput from './utils/validateMenteeSessionInput';

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
    }
  }
  `;

// prehook logic to check if added MenteeSession(user and topic id) is already present
const addMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  // validate input
  validateMenteeSessionInput(params);
  // check if the document for called user and topic is already present
  const userId = get(params, 'userConnectId');
  const topicId = get(params, 'topicConnectId');

  // log in case user or topic id is not present
  if (!userId || !topicId) {
    log('Either one of userId or topicId is missing in params of addMenteeSessionValidation');
  }

  if (userId && topicId) {
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
    // if (!backendApps.includes(appName) && userIdFromContext !== userId) {
    //   throw new UserMismatchError();
    // }

    // throw error if document already exists
    const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, topicId));
    const menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');
    if (menteeSessions && menteeSessions.length) {
      throw new RelationValuesExistError();
    }
  }

  return true;
};

export default addMenteeSessionValidation;
