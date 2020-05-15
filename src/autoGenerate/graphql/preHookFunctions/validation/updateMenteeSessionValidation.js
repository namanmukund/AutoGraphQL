import { get } from 'lodash';
import validateMenteeSessionInput from './utils/validateMenteeSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import menteeSessionQuery from '../../graphqlQueries/menteeSessionQuery';

const updateMenteeSessionValidation = async (params, mutationOrQueryName, context) => {
  // validate input
  await validateMenteeSessionInput(params, context);
  const { id: menteeSessionId } = params;
  const menteeSessionData = await callLocalGraphqlApi(menteeSessionQuery(menteeSessionId));
  const menteeSession = get(menteeSessionData, 'data.menteeSession');
  if (!menteeSession || !menteeSession.id) {
    throw new DatabaseRecordNotFoundError();
  }
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = menteeSession;
  return true;
};

export default updateMenteeSessionValidation;
