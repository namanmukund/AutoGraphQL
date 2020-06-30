import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';

const checkIfMentorIsAvailable = async (userId) => {
  const currentDate = new Date();
  const slotTime = currentDate.getHours();
  const availabilityDate = currentDate.setHours(0, 0, 0, 0);
  const query = `
      {
        mentorSessionsMeta(filter: {and: [
          {user_some: {id: "${userId}"}}, 
          {availabilityDate: "${new Date(availabilityDate)}"}, 
          {slot${slotTime}: true}]
        }) {
          count
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  const count = get(res, 'data.mentorSessionsMeta.count');
  if (!count || (count && count === 0)) {
    return false;
  }
  return true;
};

export default checkIfMentorIsAvailable;
