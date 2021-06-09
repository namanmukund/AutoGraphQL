import { get } from 'lodash';
import validateMentorSessionInput from './utils/validateMentorSessionInput';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import mentorSessionQuery from '../../graphqlQueries/mentorSessionQuery';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from './utils/getUserIdandAppNameAfterValidation';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlotsTime from './utils/getSelectedSlotsTime';
import checkIfSlotCanBeOpenedValidation from './utils/checkIfSlotCanBeOpenedValidation';
import checkIfSlotCanBeDeletedValidation from './utils/checkIfSlotCanBeDeletedValidation';

// query to get mentor Sessions
const getMentorSessions = (userId, availabilityDate) => `query{
    mentorSessions(filter:{
      and:[
          {user_some: {id: "${userId}"}},
          {availabilityDate: "${availabilityDate}"}
      ]
    }){
      id
      sessionType
       mentorMenteeSessions{
          id
          menteeSession{
            ${getSlotTimesInString()}
          }
        }
        batchSessions{
          id
          ${getSlotTimesInString()}
        }
    }
  }
  `;

const updateMentorSessionValidation = async (params, mutationOrQueryName, context) => {
  const { id: mentorSessionId } = params;
  const mentorSessionData = await callLocalGraphqlApi(mentorSessionQuery(mentorSessionId));
  const mentorSession = get(mentorSessionData, 'data.mentorSession');
  if (mentorSession && !mentorSession) {
    throw new DatabaseRecordNotFoundError();
  }
  const mentorUserId = get(mentorSession, 'user.id', '');
  const availabilityDate = get(params, 'input.availabilityDate', '');
  const { input } = params;
  // only if input is passed, proceed to validate
  if (input) {
    validateMentorSessionInput(params, mentorSession, context);
  }

  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);

  const {
    appName,
  } = userAndAppInfo;
  context.appName = appName;
  // check for slots that are passed as false and as well as true
  // eslint-disable-next-line no-param-reassign
  context.previousDocument = mentorSession;

  if (mentorUserId && availabilityDate) {
    // get all mentorSessions for the availability date
    const getMentorSessionsRes = await callLocalGraphqlApi(
      getMentorSessions(
        mentorUserId,
        availabilityDate,
      ),
    );
    // if a slot is true from before we do not need to validate that
    const timeSlotsInPrevDoc = getSelectedSlotsTime(mentorSession);
    // there can be a max of 3 mentorSessions for an availability date of type(batch/trial/paid)
    // we will check that slot which is being sent true in not already booked for other type
    const mentorSessions = get(getMentorSessionsRes, 'data.mentorSessions');
    checkIfSlotCanBeOpenedValidation(params, mentorSessions, timeSlotsInPrevDoc);
    // slots that are already consumed can not be deleted(set to false)
    checkIfSlotCanBeDeletedValidation(params, mentorSession);
  }
  return true;
};

export default updateMentorSessionValidation;
