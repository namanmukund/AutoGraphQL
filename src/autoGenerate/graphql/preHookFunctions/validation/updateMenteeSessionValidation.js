import { get } from 'lodash';
import validateMenteeSessionInput, { getHoursDiff } from './utils/validateMenteeSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import menteeSessionQuery from '../../graphqlQueries/menteeSessionQuery';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';
// import validateMenteeSession from './utils/validateMenteeSession';
import getMentorMenteeSession from '../../postHookFunctions/utils/getMentorMenteeSession';
import { ALLOWED_ROLE_FOR_MANUAL_SESSIONS, TMS, TBA } from '../../../../../constants';
import getSelectedSlotsStringArray from '../../postHookFunctions/utils/getSelectedSlotsStringArray';
import isMentorChild from '../../postHookFunctions/utils/isMentorChild';

const updateMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: menteeSessionId } = params;
  const menteeSessionData = await callLocalGraphqlApi(menteeSessionQuery(menteeSessionId));
  const menteeSession = get(menteeSessionData, 'data.menteeSession');
  const mentorMenteeSession = await getMentorMenteeSession(menteeSessionId);
  const { mentorSessionId, id: mmsId } = mentorMenteeSession;

  context.mentorSessionId = mentorSessionId;
  context.mmsId = mmsId;
  context.mentorMenteeSessionDoc = mentorMenteeSession;
  if (!menteeSession || !menteeSession.id) {
    throw new DatabaseRecordNotFoundError();
  }

  // getting current user from context to send in logs
  const userInfo = validateTokenAndExtractInformation(context, false);
  const {
    currentUser,
  } = userInfo;

  context.isTrialSession = get(menteeSession, 'topic.order') === 1;
  context.currentUser = currentUser;
  const userRoleFromContext = currentUser && currentUser.role;

  /*
  Calling method to get app name, we will skip validation if it is called from backend
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
    userIdFromContext,
  } = userAndAppInfo;

  context.userIdFromContext = userIdFromContext;
  context.appName = appName;
  // getHoursDiff()
  const prevSlotTimeStringArray = getSelectedSlotsStringArray(menteeSession);
  const slotTimeStringArray = getSelectedSlotsStringArray(get(params, 'input'));
  if (prevSlotTimeStringArray.length && slotTimeStringArray.length && (prevSlotTimeStringArray[0] !== slotTimeStringArray[0])) {
    Object.assign(params.input, {
      bookedAt: `${new Date()}`,
    });
    let date = get(menteeSession, 'bookingDate');
    if (get(params, 'input.bookingDate')) {
      date = get(params, 'input.bookingDate');
    }
    if (ALLOWED_ROLE_FOR_MANUAL_SESSIONS.includes(userRoleFromContext) && get(context, 'isTrialSession', false)) {
      const timeDiff = getHoursDiff(slotTimeStringArray[0].split('slot')[1], date);
      if (timeDiff) {
        context.isManualSession = timeDiff;
      }
    }
  }
  // validate input if call is not from TMS, allowing user to reschedule as per his choice
  if (appName !== TMS) {
    await validateMenteeSessionInput(params, context);
  }
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = menteeSession;

  const userId = get(menteeSession, 'user.id', '');
  const mentorChild = await isMentorChild(userId);
  if (!mentorChild && slotTimeStringArray && slotTimeStringArray.length > 0 && appName !== TBA) {
    // const validationFailed = await validateMenteeSession(slotTimeStringArray[0], userId, get(params, 'input.bookingDate'));
    // if (validationFailed) {
    //   throw new SlotsOccupiedError();
    // }
  }
  return true;
};

export default updateMenteeSessionValidation;
