import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import { PastDateOrSlotError } from '../../../../../constants/errors/db';
import menteeSessionQuery from '../../graphqlQueries/menteeSessionQuery';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

const deleteMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: menteeSessionId } = params;
  const menteeSessionData = await callLocalGraphqlApi(menteeSessionQuery(menteeSessionId));
  const menteeSession = get(menteeSessionData, 'data.menteeSession');

  if (!menteeSession || !menteeSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  /*
  Calling method to get app name, we will skip validation if it is called from backend
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
    userIdFromContext,
  } = userAndAppInfo;

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;
  context.currentUser = currentUser;

  context.userIdFromContext = userIdFromContext;

  context.appName = appName;

  const { bookingDate, ...slots } = menteeSession;
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

  // eslint-disable-next-line no-param-reassign
  context.previousDocument = menteeSession;
};

export default deleteMenteeSessionValidation;
