import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import getMenteeSessions from '../../../src/autoGenerate/graphql/postHookFunctions/utils/getMenteeSessions';
import sendTransactionalEmail from '../../../src/autoGenerate/graphql/resolvers/utils/sendTransactionalEmail';

const USER = (id) => `{
  user(id: "${id}") {
    name
    email
    phone {
      number
      countryCode
    }
    country
    parentProfile {
      children {
        user {
          name
        }
      }
    }
  }
}`;

const sendB2CBookReminderNextDay = async ({ userId }, deleteJob) => {
  const res = await callLocalGraphqlApi(USER(userId));
  const parentEmail = get(res, 'data.user.email');
  const parentName = get(res, 'data.user.name');
  const country = get(res, 'data.user.country');
  const phone = get(res, 'data.user.phone', {});
  const studentName = get(res, 'data.user.parentProfile.children[0].user.name');
  const menteeSessions = await getMenteeSessions(get(res, 'data.user.parentProfile.children[0].user.id'));
  if (parentEmail && menteeSessions.length === 0) {
    if (country === 'usa') {
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
        phoneNumber: phone.countryCode + phone.number,
      }, {
        emailTemplate: 'textNextDayBookingReminder',
        subject: `${studentName}'s seat is waiting. Hurry!`,
      }, country);
    } else {
      sendTransactionalEmail({
        parentEmail,
        parentName,
        studentName,
      }, {
        emailTemplate: 'B2CBookingReminderNextDay',
        subject: `${studentName}'s seat is waiting. Hurry!`,
      }, country);
    }
  }
  deleteJob();
};

export default sendB2CBookReminderNextDay;
