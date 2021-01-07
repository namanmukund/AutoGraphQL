/* eslint-disable */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import {
  SessionTopicAndTopicConnectIdMismatchError,
} from '../../../../../constants/errors/input';
import { ConnectIdRequiredError, DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

// query to get mentor batch Sessions
const mentorBatchSessionsQuery = (batchSessionConnectId, mentorSessionConnectId) => `
query{
  mentorBatchSessions(filter:{
    and:[
      {batchSession_some:{id:"${batchSessionConnectId}"}}
      {mentorSession_some:{id:"${mentorSessionConnectId}"}}
    ]   
  }){
    id
  }
}`;

// query to get batch Sessions
const batchSessionQuery = (batchSessionId) => `
query{
  batchSession(id:"${batchSessionId}"){
    id
    bookingDate
    topic{
      id
    }
    ${getSlotTimesInString()}
  }
}`;

const validateBatchStartSessionData = (batchSession, topicConnectId, params) => {
  // eslint-disable-next-line no-unused-vars
  const { bookingDate, topic: { id: topicId }, ...slots } = batchSession;
  if (topicConnectId !== topicId) {
    throw new SessionTopicAndTopicConnectIdMismatchError();
  }
  const slotTimeArray = getSelectedSlotsTime(slots);
  const date = new Date(bookingDate);
  const sessionStartDate = date.setHours(date.getHours() + slotTimeArray[0]);
  params.input = {...params.input,  sessionStartDate: new Date(sessionStartDate).toISOString()}
  const sessionEndDate = date.setHours(date.getHours() + 1);
  const currentDate = new Date();
  return true;
};
// prehook logic to check if added MentorBatchSession(batch connect  id and mentor connect id) already exists
const addMentorBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  const { batchSessionConnectId, mentorSessionConnectId, topicConnectId } = params;
  if (!batchSessionConnectId || !mentorSessionConnectId || !topicConnectId) {
    throw new ConnectIdRequiredError();
  }

  // check if mentor batch sessions already exist
  const mentorBatchSessionsData = await callLocalGraphqlApi(
    mentorBatchSessionsQuery(
      batchSessionConnectId,
      mentorSessionConnectId,
    ),
  );

  const mentorBatchSessions = get(mentorBatchSessionsData, 'data.mentorBatchSessions');
  if (mentorBatchSessions && mentorBatchSessions.length) {
    throw new SimilarDocumentAlreadyExistError();
  }
  // validate date and time of starting the session
  const batchSessionData = await callLocalGraphqlApi(
    batchSessionQuery(batchSessionConnectId),
  );
  const batchSession = get(batchSessionData, 'data.batchSession');
  if (!batchSession.id) {
    throw new DatabaseRecordNotFoundError({
      date: {
        message: 'batch session does not exist',
      },
    });
  }
  validateBatchStartSessionData(batchSession, topicConnectId, params);
  return true;
};

export default addMentorBatchSessionValidation;
