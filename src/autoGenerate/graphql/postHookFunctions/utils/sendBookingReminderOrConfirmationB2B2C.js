import { get } from 'lodash';
// import moment from 'moment';
// import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
// import getSlotLabel from '../../../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';
// import updateBookSessionReminderStatus from './updateBookSessionReminderStatus';

const USER_QUERY = (userId) => `
  query {
    user(id: "${userId}") {
      email
      name
      phone {
        number
        countryCode
      }
      parentProfile {
        children {
          user {
            name
          }
          batch {
            b2b2ctimeTable {
              ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
              bookingDate
            }
          }
        }
      }
      campaign {
        type
        code
        title
        school {
          name
        }
      }
    }
  }
`;

const sendBookingReminderOrConfigmationB2B = async (userId) => {
  // const { bookingDate, ...slots } = timeTable;
  // const slotTime = Object.keys(slots).find((slot) => slots[slot]);
  // console.log(
  //   'BOOKED - sent mail and wati',
  //   parentName,
  //   schoolName,
  //   studentName,
  //   moment(bookingDate).format('dddd, Do MMM'),
  //   getSlotLabel(slotTime.replace('slot', '')),
  // );
  setTimeout(async () => {
    const res = await callLocalGraphqlApi(USER_QUERY(userId));
    const user = get(res, 'data.user', {}) || {};
    const campaign = get(user, 'campaign', {}) || {};
    const schoolName = get(campaign, 'school.name');
    const code = get(user, 'campaign.code', '');
    const bookingLink = `https://www.tekie.in/login?code=${code}`;
    const phone = get(user, 'phone.countryCode', '').replace('') + get(user, 'phone.number', '');

    if (campaign.type === 'b2b2cEvent') {
      if (!user.email) {
        sendWhatsAppTemplateMessage(phone, 'workshop_registration_4', schoolName, [
          { name: 'school_name', value: schoolName },
          { name: 'code', value: code },
          { name: 'booking_link', value: bookingLink },
        ]);
        return;
      }
      const parentName = get(user, 'name');
      const studentName = get(user, 'parentProfile.children[0].user.name');
      const timeTable = get(user, 'parentProfile.children[0].batch.b2b2ctimeTable', {});
      if (timeTable.bookingDate) {
        return;
      }
      sendTransactionalEmail({
        parentEmail: user.email,
        bookingLink,
      }, {
        subject: 'Book your Spot at Tekie Code Carnival!',
        emailTemplate: 'CarivalEmailRegistrationConfirmed',
      });
      sendWhatsAppTemplateMessage(phone, 'workshop_registration_confirmation3', schoolName, [
        { name: 'parent_name', value: parentName },
        { name: 'student_name', value: studentName },
        { name: 'code', value: code },
        { name: 'school_name', value: schoolName },
        { name: 'booking_link', value: bookingLink },
      ]);
    }
  }, 500 * 60);
};

export default sendBookingReminderOrConfigmationB2B;
