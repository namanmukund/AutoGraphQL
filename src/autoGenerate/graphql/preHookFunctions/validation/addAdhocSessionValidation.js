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
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';

// query to get batch Sessions
const getAdhocSession = (batchId, order) => `
  query{
    adhocSessions(filter:{
      and:[
        {batch_some: {
          id: "${batchId}"
        }},
        {
          order: ${order}
        }
      ]
    }){
      id
      order
    }
  }
  `;

// query to get mentor from mentorSessionConnectId
const fetchMentor = (id) => `
query{
  mentorSession(id: "${id}"){
    id
    user{
      id
    }
  }
}`;

const validateBatchStartSessionData = (params) => {
  // eslint-disable-next-line no-unused-vars
  const { bookingDate, ...slots } = params.input;
  const slotTimeArray = getSelectedSlotsTime(slots);
  const date = new Date(bookingDate);
  const sessionStartDate = date.setHours(date.getHours() + slotTimeArray[0]);
  params.input = { ...params.input, sessionStartDate: new Date(sessionStartDate).toISOString() }
  return true;
};

// prehook logic to check if added Adhoc session(batch and order) is already present
const addAdhocSessionValidation = async (params, mutationOrQueryName, context) => {
  // check if the document for called batch and topic is already present
  const batchId = get(params, 'batchConnectId');
  const order = get(params, 'input.order');
  const mentorSessionConnectId = get(params, 'mentorSessionConnectId');

  if (!batchId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'batchConnectId is missing in input',
      },
    });
  }


  // getting user role from context. We will allow adding batchSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);

  const {
    currentUser
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;
  context.currentUser = currentUser;
  /*
    Calling method to validate token and return appName to check if action should be allowed
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;

  context.appName = appName

  // validate input (validate booking date and slots similar to addBatchSession)
  await validateBatchSessionInput(params, context, 'addBatch');

  // check if mentor already has another session in same slot
  const fetchMentorRes = await callLocalGraphqlApi(fetchMentor(mentorSessionConnectId));
  const mentorUserId = get(fetchMentorRes, 'data.mentorSession.user.id', '');
  const bookingDate = get(params, 'input.bookingDate', '');
  if (mentorUserId && bookingDate) {
    const getMentorSessionsRes = await callLocalGraphqlApi(
      getMentorSessions(
        mentorUserId,
        bookingDate,
      ),
    );
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    checkIfSlotCanBeOpenedValidation(params, mentorSessions);
  }

  if (
    !backendApps.includes(appName)
    && !(userRoleFromContext === ADMIN || userRoleFromContext === UMS_ADMIN
      || userRoleFromContext === MENTOR || userRoleFromContext === UMS_VIEWER)
  ) {
    throw new PermissionDeniedError();
  }

  // throw error if document already exists with same order connected to same batch
  if (order) {
    const getAdhocSessionRes = await callLocalGraphqlApi(getAdhocSession(batchId, order));
    const adhocSessions = get(getAdhocSessionRes, 'data.adhocSessions');
    if (adhocSessions && adhocSessions.length) {
      throw new SimilarDocumentAlreadyExistError();
    }
  }

  return true;
};

export default addAdhocSessionValidation;
