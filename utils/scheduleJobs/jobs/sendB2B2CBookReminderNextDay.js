import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendTransactionalEmail from '../../../src/autoGenerate/graphql/resolvers/utils/sendTransactionalEmail';

const USER = (id) => `{
  user(id: "${id}") {
    name
    email
    phone {
      number
      countryCode
    }
    parentProfile {
      children {
        batch {
          id
        }
        user {
          name
        }
      }
    }
  }
}`;

const sendB2B2CBookReminderNextDay = async ({ userId, code }, deleteJob) => {
  const res = await callLocalGraphqlApi(USER(userId));
  const parentEmail = get(res, 'data.user.email');
  const parentName = get(res, 'data.user.name');
  const studentName = get(res, 'data.user.parentProfile.children[0].user.name');
  const batchId = get(res, 'data.user.parentProfile.children[0].batch.id');
  if (parentEmail && !batchId) {
    sendTransactionalEmail({
      parentEmail,
      parentName,
      studentName,
      bookingLink: `https://www.tekie.in/login?code=${code}`,
    }, {
      emailTemplate: 'CarnivalEmailRegistrationConfirmedBookingReminder',
      subject: 'Hurry! Just a few free spots left at Tekie Code Jam',
    });
  }
  deleteJob();
};

export default sendB2B2CBookReminderNextDay;
