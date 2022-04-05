import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callGraphqlApi';
import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
import getSelectedSlotsStringArray from '../../../postHookFunctions/utils/getSelectedSlotsStringArray';

const getMenteeSessions = (userId, bookingDate) => `
  query{
    menteeSessions(filter:{
      and:[
         {user_some: {
          id: "${userId}"
        }},
        {
          bookingDate: "${bookingDate}"
        },
      ]
    }){
      id
      ${getSlotTimesInString()}
    }
  }
  `;

const validateMenteeSession = async (slot, userId, bookingDate) => {
  const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, bookingDate));
  const menteeSessions = get(getMenteeSessionsRes, 'data.menteeSessions');
  if (menteeSessions && menteeSessions.length) {
    for (let i = 0; i < menteeSessions.length; i += 1) {
      const oldSlots = getSelectedSlotsStringArray(menteeSessions[i]);
      if (oldSlots && oldSlots.length) {
        if (oldSlots[0] === slot) {
          return true;
        }
      }
    }
  }
  return false;
};

export default validateMenteeSession;
