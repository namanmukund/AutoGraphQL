/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { log } from '../../../../../utils';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import getSelectedSlotsStringArray from './getSelectedSlotsStringArray';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const closeSessionsForInactiveMentor = async (input) => {
  const query = `{
        mentorSessions(
          filter: {
            and: [
              {
                availabilityDate_gt: "${new Date().toISOString()}"
              }
              {
                user_some:{
                  mentorProfile_some:{
                    id:"${get(input, 'id')}"
                  }
                }
              }
            ]
          }
        ) {
          id
          ${getSlotTimesInString()}
          availabilityDate
        }
      }`;

  const deleteMentorSessionQuery = (sessionId) => `
  mutation{
    deleteMentorSession(id:"${sessionId}"){
      id
    }
  }
      `;

  const res = await callLocalGraphqlApi(query);
  const mentorSessions = get(res, 'data.mentorSessions', []);
  for (let i = 0; i < mentorSessions.length; i += 1) {
    const listOfTrueSlots = getSelectedSlotsStringArray(mentorSessions[i]);
    if (listOfTrueSlots.length) {
      await callLocalGraphqlApi(deleteMentorSessionQuery(get(mentorSessions[i], 'id')));
      log(`deleted session id ${get(mentorSessions[i], 'id')}`);
    }
  }
};

export default closeSessionsForInactiveMentor;
