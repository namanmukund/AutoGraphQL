import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getMenteeSessions = async (userId) => {
  const menteeSessionQuery = `
    query {
      menteeSessions(
        filter: {
          user_some: {
            id: "${userId}"
          }
        }
        orderBy: bookingDate_ASC
      ) {
        id
        updatedAt
        topic {
          id
        }
        user {
          id
          isBookSessionReminderSent
        }
        bookingDate
        ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
      }
    }`;
  const res = await callLocalGraphqlApi(menteeSessionQuery);
  const menteeSessions = get(res, 'data.menteeSessions', []);
  return menteeSessions;
};

export default getMenteeSessions;
