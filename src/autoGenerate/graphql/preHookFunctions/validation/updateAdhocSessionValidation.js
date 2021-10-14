import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, MentorMandatoryError } from '../../../../../constants/errors';
import adhocSessionQuery from '../../graphqlQueries/adhocSessionQuery';
import {
  CanNotChangeSessionStatusError,
} from '../../../../../constants/errors/input';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { sessionStatus } from '../../../../../constants';
import validateBatchSessionInput from './utils/validateBatchSessionInput';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';

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

const updateAdhocSessionValidation = async (params, mutationOrQueryName, context) => {
  const {
    id: adhocSessionId, mentorSessionConnectId, input: { sessionStatus: sessionStatusInInput, bookingDate: bookingDateFromInput, ...inputSlot },
  } = params;
  const adhocSessionData = await callLocalGraphqlApi(adhocSessionQuery(adhocSessionId));
  const adhocSession = get(adhocSessionData, 'data.adhocSession');
  if (!adhocSession || !adhocSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // validate input
  await validateBatchSessionInput(params, context);

  const {
    sessionStatus: prevSessionStatus,
    batch,
    bookingDate,
    course,
    mentorSession,
    ...slots
  } = adhocSession;

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
    checkIfSlotCanBeOpenedValidation(menteeSessionSlots, mentorSessions);
  }

  context.adhocSessionId = adhocSessionId;
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
  context.prevStudentsAttendanceCount = get(adhocSession, 'attendance', []).length;

  // while starting/completing a adhocSession, mentor should be there in batch
  if (!allottedMentorId && (sessionStatusInInput === sessionStatus.started || sessionStatusInInput === sessionStatus.completed)) {
    throw new MentorMandatoryError();
  }

  // if session is complete and user is trying to change the status then throw error
  if (prevSessionStatus === sessionStatus.completed && sessionStatusInInput && sessionStatusInInput !== sessionStatus.completed) {
    throw new CanNotChangeSessionStatusError();
  }

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
    currentApp,
  } = userInfo;
  context.prevIsAudit = get(adhocSession, 'isAudit', false);
  context.batchTopicOrder = get(adhocSession, 'topic.order');
  context.batchTypeValue = get(adhocSession, 'batch.type');
  context.currentUser = currentUser;
  context.appName = get(currentApp, 'name');
  return true;
};

export default updateAdhocSessionValidation;
