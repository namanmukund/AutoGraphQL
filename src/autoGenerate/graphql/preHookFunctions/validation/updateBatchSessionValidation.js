import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, MentorMandatoryError } from '../../../../../constants/errors';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';
import {
  CanNotChangeSessionStatusError,
  MissingMandatoryInputInRequestError,
} from '../../../../../constants/errors/input';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { sessionStatus } from '../../../../../constants';
import validateBatchSessionInput from './utils/validateBatchSessionInput';

const updateBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: batchSessionId, topicConnectId, input: { sessionStatus: sessionStatusInInput, bookingDate: bookingDateFromInput, ...inputSlot } } = params;
  const batchSessionData = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(batchSessionData, 'data.batchSession');
  if (!batchSession || !batchSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // validate input
  await validateBatchSessionInput(params, context);

  const {
    sessionStatus: prevSessionStatus,
    batch,
    topic,
    bookingDate,
    course,
    mentorSession,
    ...slots
  } = batchSession;
  const inputSlotTimeArray = getSelectedSlotsTime(inputSlot);
  const slotTimeArray = getSelectedSlotsTime(slots);
  context.batchSessionId = batchSessionId;
  context.topicId = topic && topic.id;
  context.inputSlot = inputSlot;
  context.batchId = batch && batch.id;
  context.bookingDate = bookingDate;
  context.mentorSessionConnectId = mentorSession && mentorSession.id;
  context.slotTimeArray = slotTimeArray;
  context.bookingDateFromInput = bookingDateFromInput;
  context.inputSlotTimeArray = inputSlotTimeArray;
  const allottedMentorId = batch && batch.allottedMentor && batch.allottedMentor.id;
  context.allottedMentorId = allottedMentorId;
  context.courseId = course && course.id;

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

  // while starting/completing a batchSession, mentor should be there in batch
  if (!allottedMentorId && (sessionStatusInInput === sessionStatus.started || sessionStatusInInput === sessionStatus.completed)) {
    throw new MentorMandatoryError();
  }

  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === sessionStatus.completed && sessionStatusInInput && sessionStatusInInput !== sessionStatus.completed) {
    throw new CanNotChangeSessionStatusError();
  }

  return true;
};

export default updateBatchSessionValidation;
