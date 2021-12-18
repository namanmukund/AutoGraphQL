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
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';
import extractSlotsFromInput from '../../../../../utils/extractSlotsFromInput';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

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

const getBatchSession = (batchId,
  bookingDate,
  slots) => `
  {
    batchSessions(filter:{
      and:[
        {batch_some:{id:"${batchId}"}}
        {bookingDate: "${bookingDate}"}
        {
        and:[
          ${slots}
        ]
      }
      ]
    }){
      id
    }
  }
`;

const updateBatchSessionValidation = async (params, mutationOrQueryName, context) => {
  const {
    id: batchSessionId, topicConnectId, mentorSessionConnectId, input: { sessionStatus: sessionStatusInInput, bookingDate: bookingDateFromInput, ...inputSlot },
  } = params;
  const batchSessionData = await callLocalGraphqlApi(batchSessionQuery(batchSessionId));
  const batchSession = get(batchSessionData, 'data.batchSession');
  if (!batchSession || !batchSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
    currentApp,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;

  // validate input
  await validateBatchSessionInput(params, context, '', userRoleFromContext);

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

  // check if mentor already has another session in same slot
  const fetchMentorRes = await callLocalGraphqlApi(fetchMentor(mentorSessionConnectId || get(mentorSession, 'id', '')));
  const mentorUserId = get(fetchMentorRes, 'data.mentorSession.user.id', '');
  if (mentorUserId && bookingDateFromInput) {
    const finalBookingDate = bookingDateFromInput || bookingDate;
    const getMentorSessionsRes = await callLocalGraphqlApi(
      getMentorSessions(
        mentorUserId,
        finalBookingDate,
      ),
    );
    let tempObj = { ...inputSlot };
    if (inputSlotTimeArray.length === 0) {
      tempObj = { bookingDate: finalBookingDate, ...slots };
    }
    const menteeSessionSlots = { input: tempObj };
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    checkIfSlotCanBeOpenedValidation(menteeSessionSlots, mentorSessions, null, get(batch, 'code'));

    // check batch session exists for the same batch at the same slot
    if (inputSlotTimeArray[0] !== slotTimeArray[0]) {
      const batchId = get(batch, 'id');
      const { filteredSlotsStringForFilterQuery } = extractSlotsFromInput(inputSlot);
      const batchSessionRes = await callLocalGraphqlApi(getBatchSession(batchId, bookingDateFromInput, filteredSlotsStringForFilterQuery));
      const existingBatchSessions = get(batchSessionRes, 'data.batchSessions', []);
      if (existingBatchSessions.length) {
        throw new SimilarDocumentAlreadyExistError();
      }
    }
  }

  context.batchSessionId = batchSessionId;
  context.topicId = topic && topic.id;
  context.inputSlot = inputSlot;
  context.batchId = batch && batch.id;
  context.bookingDate = bookingDate;
  context.mentorSessionConnectId = mentorSessionConnectId;
  context.prevMentor = get(batch, 'allottedMentor.user', {});
  context.slotTimeArray = slotTimeArray;
  context.bookingDateFromInput = bookingDateFromInput;
  context.inputSlotTimeArray = inputSlotTimeArray;
  const allottedMentorId = batch && batch.allottedMentor && batch.allottedMentor.id;
  context.allottedMentorId = allottedMentorId;
  context.courseId = course && course.id;
  context.prevSessionStatus = prevSessionStatus;
  context.prevStudentsAttendanceCount = get(batchSession, 'attendance', []).length;

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

  context.prevIsAudit = get(batchSession, 'isAudit', false);
  context.batchTopicOrder = get(batchSession, 'topic.order');
  context.batchTypeValue = get(batchSession, 'batch.type');
  context.currentUser = currentUser;
  context.appName = get(currentApp, 'name');
  return true;
};

export default updateBatchSessionValidation;
