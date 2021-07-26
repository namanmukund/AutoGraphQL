import { get } from 'lodash';
import validateMenteeSessionInput from './utils/validateMenteeSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import menteeSessionQuery from '../../graphqlQueries/menteeSessionQuery';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import validateTokenAndExtractInformation from './utils/validateTokenAndExtractInformation';

const updateMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: menteeSessionId } = params;
  const menteeSessionData = await callLocalGraphqlApi(menteeSessionQuery(menteeSessionId));
  const menteeSession = get(menteeSessionData, 'data.menteeSession');
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

  // validate input
  await validateMenteeSessionInput(params, context);
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = menteeSession;
  return true;
};

export default updateMenteeSessionValidation;
