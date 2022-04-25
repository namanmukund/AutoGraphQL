import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError, MentorMandatoryError, UnauthorizedOperationError } from '../../../../../constants/errors';
import batchSessionQuery from '../../graphqlQueries/batchSessionQuery';
import {
  CanNotChangeSessionStatusError,
  MissingMandatoryInputInRequestError,
} from '../../../../../constants/errors/input';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import {
  ALLOWED_ROLE_FOR_MANUAL_SESSIONS, sessionStatus, TWA,
} from '../../../../../constants';
import validateBatchSessionInput from './utils/validateBatchSessionInput';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getMentorSessions from '../../../utils/getMentorSessions';
import { checkIfSlotCanBeOpenedValidation } from './utils';
import extractSlotsFromInput from '../../../../../utils/extractSlotsFromInput';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';
import isTrialSession from '../../resolvers/utils/isTrialSession';
import { getHoursDiff } from './utils/validateMenteeSessionInput';
import { MENTOR, MENTEE } from '../../../../../constants/roles';

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

const getCurrentUser = async (userId) => {
  const query = `{
  studentProfiles(filter: { user_some: { id: "${userId}" } }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.studentProfiles[0].id');
};

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
  if (get(params, 'input.attendance.updateWhere.studentReferenceId')
    && get(currentApp, 'name') === TWA) {
    const studentProfileId = await getCurrentUser(get(currentUser, 'id'));
    if (studentProfileId !== get(params, 'input.attendance.updateWhere.studentReferenceId')) {
      throw new UnauthorizedOperationError();
    }
  }

  const {
    sessionStatus: prevSessionStatus,
    batch,
    topic,
    bookingDate,
    course,
    mentorSession,
    ...slots
  } = batchSession;

  context.topicId = topic && topic.id;
  if (topic && topic.id) {
    context.isTrialSession = await isTrialSession(get(topic, 'id'));
  }
  // validate input
  await validateBatchSessionInput(params, context, '', userRoleFromContext);

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
    if (inputSlotTimeArray.length > 0 && inputSlotTimeArray[0] !== slotTimeArray[0]) {
      const batchId = get(batch, 'id');
      if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && get(context, 'isTrialSession', false)) {
        if (inputSlotTimeArray.length > 0) {
          let date = bookingDate;
          if (bookingDateFromInput) {
            date = bookingDateFromInput;
          }
          const timeDiff = getHoursDiff(inputSlotTimeArray[0], date);
          if (timeDiff) {
            context.isManualSession = timeDiff;
          }
        }
      }
      const { filteredSlotsStringForFilterQuery } = extractSlotsFromInput(inputSlot);
      const batchSessionRes = await callLocalGraphqlApi(getBatchSession(batchId, bookingDateFromInput, filteredSlotsStringForFilterQuery));
      const existingBatchSessions = get(batchSessionRes, 'data.batchSessions', []);
      if (existingBatchSessions.length) {
        throw new SimilarDocumentAlreadyExistError();
      }
    }
  }

  context.batchSessionId = batchSessionId;
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
  if (sessionStatusInInput === sessionStatus.started
    && get(batch, 'type') === 'b2b') {
    if (userRoleFromContext === MENTOR) {
      Object.assign(params.input, {
        sessionStartedByMentorAt: new Date().toISOString(),
      });
    }
    if (prevSessionStatus === sessionStatus.allotted && userRoleFromContext === MENTEE) {
      Object.assign(params.input, {
        startSessionByMentee: new Date().toISOString(),
      });
    }
  }

  context.prevIsAudit = get(batchSession, 'isAudit', false);
  context.batchTopicOrder = get(batchSession, 'topic.order');
  context.batchTypeValue = get(batchSession, 'batch.type');
  context.currentUser = currentUser;
  context.appName = get(currentApp, 'name');
  context.userRoleFromContext = userRoleFromContext;
  return true;
};

export default updateBatchSessionValidation;
