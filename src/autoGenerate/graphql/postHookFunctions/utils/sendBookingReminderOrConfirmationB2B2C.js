import { get } from 'lodash';
import moment from 'moment';
import getSlotLabel from '../../../../../utils/getSlotLabel';
// import moment from 'moment';
// import transactionalMessageBody from '../../../../../constants/transactionalMessageBody';
// import getSlotLabel from '../../../../../utils/getSlotLabel';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';
import updateBookSessionReminderStatus from './updateBookSessionReminderStatus';

const USER_QUERY = (userId) => `
  query {
    user(id: "${userId}") {
      email
      name
      isBookSessionReminderSent
      createdAt
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

const sendBookingReminderOrConfirmationB2B = async (userId, isBookSlot = false) => {
  const timeout = isBookSlot ? 0 : 5000 * 60;
  // const slotTime = Object.keys(slots).find((slot) => slots[slot]);
  // console.log(
  //   'BOOKED - sent mail and wati',
  //   parentName,
  //   schoolName,
  //   studentName,
  // moment(bookingDate).format('dddd, Do MMM'),
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
        if (!isBookSlot) return;
        if (get(user, 'isBookSessionReminderSent')) return;
        const { bookingDate, ...slots } = timeTable;
        const slotTime = Object.keys(slots).find((slot) => slots[slot]);
        await updateBookSessionReminderStatus(get(user, 'id'), true);
        sendTransactionalEmail({
          parentEmail: user.email,
          workshopDate: moment(bookingDate).format('dddd, Do MMM'),
          studentName,
          parentName,
          schoolName,
          startTime: getSlotLabel(slotTime.replace('slot', '')).startTime,
          endTime: getSlotLabel(slotTime.replace('slot', '')).endTime,
        }, {
          subject: `Here's ${studentName}'s Pass for Tekie Code Carnival`,
          emailTemplate: 'CarnivalEmailBookingFinal',
        });
        const bookTemplate = moment().diff(moment(get(user, 'createdAt'))) < 5000 * 60 ? 'workshop_registration_confirmation1' : 'workshop_booking_confirmation';
        const parameters = moment().diff(moment(get(user, 'createdAt'))) < 5000 * 60
          ? [
            { name: 'parent_name', value: parentName },
            { name: 'student_name', value: studentName },
            { name: 'w_date', value: moment(bookingDate).format('dddd, Do MMM') },
            { name: 'w_time', value: getSlotLabel(slotTime.replace('slot', '')).startTime },
            { name: 'school_name', value: schoolName },
          ] : [
            { name: 'parent_name', value: parentName },
            { name: 'student_name', value: studentName },
            { name: 'w_date', value: moment(bookingDate).format('dddd, Do MMM') },
            { name: 'w_time', value: getSlotLabel(slotTime.replace('slot', '')).startTime },
          ]
        sendWhatsAppTemplateMessage(phone, bookTemplate, phone, parameters);
      } else {
        sendTransactionalEmail({
          parentEmail: user.email,
          bookingLink,
        }, {
          subject: 'Book your Spot at Tekie Code Carnival!',
          emailTemplate: 'CarivalEmailRegistrationConfirmed',
        });
        sendWhatsAppTemplateMessage(phone, 'workshop_registration_confirmation3', phone, [
          { name: 'parent_name', value: parentName },
          { name: 'student_name', value: studentName },
          { name: 'code', value: code },
          { name: 'school_name', value: schoolName },
          { name: 'booking_link', value: bookingLink },
        ]);
      }
    }
  }, timeout);
};

export default sendBookingReminderOrConfirmationB2B;
