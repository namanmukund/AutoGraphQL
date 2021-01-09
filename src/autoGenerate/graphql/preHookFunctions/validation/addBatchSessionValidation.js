/* eslint-disable */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { PermissionDeniedError } from '../../../../../constants/errors';
import {
  ADMIN, UMS_ADMIN, MENTOR, UMS_VIEWER,
} from '../../../../../constants/roles';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import validateBatchSessionInput from './utils/validateBatchSessionInput';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';

// query to get batch Sessions
const getBatchSessions = (batchId, topicId) => `
  query{
    batchSessions(filter:{
      and:[
         {batch_some: {
          id: "${batchId}"
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

// prehook logic to check if added BatchSession(batch and topic id) is already present
const addBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  // check if the document for called batch and topic is already present
  const batchId = get(params, 'batchConnectId');
  const topicId = get(params, 'topicConnectId');

  // log in case batch or topic id is not present
  if (!batchId || !topicId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Either batchConnectId or topicConnectId or all missing in input',
      },
    });
  }

  // getting user role from context. We will allow adding batchSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;

  /*
    Calling method to validate token and return appName to check if action should be allowed
    */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;

  // validate input
  await validateBatchSessionInput(params);

  if (
    !backendApps.includes(appName)
    && !(userRoleFromContext === ADMIN || userRoleFromContext === UMS_ADMIN
     || userRoleFromContext === MENTOR || userRoleFromContext === UMS_VIEWER)
  ) {
    throw new PermissionDeniedError();
  }

  // throw error if document already exists
  const getBatchSessionsRes = await callLocalGraphqlApi(getBatchSessions(batchId, topicId));
  const batchSessions = get(getBatchSessionsRes, 'data.batchSessions');
  if (batchSessions && batchSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }

  validateBatchSessionInput(params);

  return true;
};

export default addBatchSessionValidation;
