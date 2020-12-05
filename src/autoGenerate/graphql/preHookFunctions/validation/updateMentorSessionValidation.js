import { get } from 'lodash';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import mentorSessionQuery from '../../graphqlQueries/mentorSessionQuery';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';

const updateMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorSessionId } = params;
  const mentorSessionData = await callLocalGraphqlApi(mentorSessionQuery(mentorSessionId));
  const mentorSession = get(mentorSessionData, 'data.mentorSession');
  if (mentorSession && !mentorSession) {
    throw new DatabaseRecordNotFoundError();
  }
  validateMentorSessionInput(params, mentorSession);
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);

  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;

  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorSession;
  return true;
};

export default updateMentorSessionValidation;
