import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import {
  ADMIN, UMS_ADMIN, UMS_VIEWER,
} from '../../../../../constants/roles';
import { backendApps } from '../../../../../constants';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import validateBatchSessionInput from './utils/validateBatchSessionInput';
import {
  SessionMustBeCompletedError,
  MissingMandatoryInputInRequestError,
  PermissionDeniedError,
  MentorIsInactiveError,
} from '../../../../../constants/errors';
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

// query to get batch Sessions
const getAdhocSession = (batchId,
  previousTopicConnectId,
  type) => `
  query{
    adhocSessions(filter:{
        and:[
          {batch_some: {
            id: "${batchId}"
          }},
          {
            previousTopic_some:{
              id: "${previousTopicConnectId}"
            }
          },
          {
            type: ${type}
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
      mentorProfile{
        isMentorActive
      }
    }
  }
}`;

// query to get batch sessions with previous topic
const getBatchSessions = (previousTopicConnectId, batchId) => `
query{
  batchSessions(filter: {
    and: [
      {batch_some: {
        id: "${batchId}"
      }}
      {topic_some: { id: "${previousTopicConnectId}" }}
    ]
  }){
    id
    sessionStatus
  }
}`;

// prehook logic to check if added Adhoc session(batch and order) is already present
const addAdhocSessionValidation = async (params, mutationOrQueryName, context) => {
  // check if the document for called batch and topic is already present
  const batchId = get(params, 'batchConnectId');
  const type = get(params, 'input.type');
  const mentorSessionConnectId = get(params, 'mentorSessionConnectId');
  const previousTopicConnectId = get(params, 'previousTopicConnectId');

  if (!batchId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'batchConnectId is missing in input',
      },
    });
  }

  if (!previousTopicConnectId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'previousTopicConnectId is missing in input',
      },
    });
  }

  // getting user role from context. We will allow adding batchSession if logged in user is admin
  const userInfo = validateTokenAndExtractInformation(context, false);

  const {
    currentUser,
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

  context.appName = appName;

  // validate input (validate booking date and slots similar to addBatchSession)
  await validateBatchSessionInput(params, context, 'addBatch');

  // check if mentor already has another session in same slot
  const fetchMentorRes = await callLocalGraphqlApi(fetchMentor(mentorSessionConnectId));
  const mentorUserId = get(fetchMentorRes, 'data.mentorSession.user.id', '');
  const bookingDate = get(params, 'input.bookingDate', '');
  const isMentorActive = get(fetchMentorRes, 'data.mentorSession.user.mentorProfile.isMentorActive');
  if (!isMentorActive) {
    throw new MentorIsInactiveError();
  }
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
    && !(userRoleFromContext === ADMIN || userRoleFromContext === UMS_ADMIN || userRoleFromContext === UMS_VIEWER)
  ) {
    throw new PermissionDeniedError();
  }

  // check is for given previous topic and type, if adhoc session exists from before throw err
  const getAdhocSessionRes = await callLocalGraphqlApi(getAdhocSession(batchId, previousTopicConnectId, type));
  const adhocSessions = get(getAdhocSessionRes, 'data.adhocSessions');
  if (adhocSessions && adhocSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }

  // confirm if the previous topic batch session is complete before proceeding
  const batchSessionPreviousTopicRes = await callLocalGraphqlApi(getBatchSessions(previousTopicConnectId, batchId));
  const batchSessionPreviousTopicStatus = get(batchSessionPreviousTopicRes, 'data.batchSessions[0].sessionStatus', '');
  if (batchSessionPreviousTopicStatus !== 'completed') {
    throw new SessionMustBeCompletedError();
  }

  return true;
};

export default addAdhocSessionValidation;
