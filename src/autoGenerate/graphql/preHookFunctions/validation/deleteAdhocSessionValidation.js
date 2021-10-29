import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { PastDateOrSlotError } from '../../../../../constants/errors/db';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
import getSelectedSlotsStringArray from '../../postHookFunctions/utils/getSelectedSlotsStringArray';
import adhocSessionQuery from '../../graphqlQueries/adhocSessionQuery';

const deleteAdhocSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: adhocSessionId } = params;
  const adhocSessionData = await callLocalGraphqlApi(adhocSessionQuery(adhocSessionId));
  const adhocSession = get(adhocSessionData, 'data.adhocSession');

  if (!adhocSession || !adhocSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  const {
    sessionStatus,
    batch,
    bookingDate,
    course,
    mentorSession,
    ...slots
  } = adhocSession;
  const slotTimeArray = getSelectedSlotsTime(slots);
  // of any slots is taken or the date is of past then the doc can not be deleted
  if (slotTimeArray && slotTimeArray.length) {
    const date = new Date(bookingDate);
    const dateTime = date.setHours(
      date.getHours() + slotTimeArray[0],
    );
    const currentDate = new Date();
    if (dateTime <= currentDate) {
      throw new PastDateOrSlotError();
    }
  }

  const slotTimeStringArray = getSelectedSlotsStringArray(slots);

  context.batchCode = batch && batch.code;
  context.bookingDate = bookingDate;
  context.mentorSessionConnectId = mentorSession && mentorSession.id;
  context.courseId = course && course.id;
  context.sessionStatus = sessionStatus;
  context.slotTimeStringArray = slotTimeStringArray;

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  context.currentUser = currentUser;
};

export default deleteAdhocSessionValidation;
