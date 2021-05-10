import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';
import { CanNotChangeSessionStatusError } from '../../../../../constants/errors/input';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';

const updateBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: batchSessionId, input: { sessionStatus, bookingDate: bookingDateFromInput } } = params;
  const batchSessionData = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(batchSessionData, 'data.batchSession');
  if (!batchSession || !batchSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // validate input, this is commented sice we are using batchSessions only to track
  // sessionStatus and all. So, the fields booking date and slots are not mandatory
  // await validateBatchSessionInput(params);

  const {
    sessionStatus: prevSessionStatus,
    batch,
    topic,
    bookingDate,
    mentorSession,
    ...slots
  } = batchSession;
  const slotTimeArray = getSelectedSlotsTime(slots);
  context.topicId = topic && topic.id;
  context.batchId = batch && batch.id;
  context.bookingDate = bookingDate;
  context.mentorSessionConnectId = mentorSession && mentorSession.id;
  context.slotTimeArray = slotTimeArray;
  context.bookingDateFromInput = bookingDateFromInput;

  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === 'completed' && sessionStatus && sessionStatus !== 'completed') {
    throw new CanNotChangeSessionStatusError();
  }
  return true;
};

export default updateBatchSessionValidation;
