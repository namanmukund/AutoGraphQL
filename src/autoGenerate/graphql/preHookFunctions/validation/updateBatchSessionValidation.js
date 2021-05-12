import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';
import {
  CanNotChangeSessionStatusError,
  MissingMandatoryInputInRequestError,
} from '../../../../../constants/errors/input';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { sessionStatus } from '../../../../../constants';

const updateBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: batchSessionId, topicConnectId, input: { sessionStatus: sessionStatusInInput, bookingDate: bookingDateFromInput } } = params;
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

  // we are doing this to handle cases where we make timetable for school without the topic being attached
  // so whenever these sessions get started we need topicId in this mutation as mandatory field
  // if topic id is not in document, we need topicConnectId in input in case session is getting started/completed
  // throwing error if above criteria is not met else updating topicId in context
  if ((!topic || (topic && !topic.id)) && (sessionStatusInInput === sessionStatus.started || sessionStatusInInput === sessionStatus.completed)) {
    if (topicConnectId) {
      context.topicId = topicConnectId;
    } else {
      throw new MissingMandatoryInputInRequestError({
        data: {
          message: 'topicConnectId is mandatory in input ',
        },
      });
    }
  }

  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === sessionStatus.completed && sessionStatusInInput && sessionStatusInInput !== sessionStatus.completed) {
    throw new CanNotChangeSessionStatusError();
  }
  return true;
};

export default updateBatchSessionValidation;
