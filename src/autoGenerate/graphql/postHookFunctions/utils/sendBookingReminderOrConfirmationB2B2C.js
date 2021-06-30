import { get } from 'lodash';
import moment from 'moment';
import getMenteSessions from './getMenteeSessions';
import getSlotLabel from '../../../../../utils/getSlotLabel';
import addToSchedule from '../../../../../utils/scheduleJobs/addToSchedule';
import sendB2B2CBookingReminder from '../../../../../utils/scheduleJobs/jobs/sendB2B2CBookingReminder';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';
import updateBookSessionReminderStatus from './updateBookSessionReminderStatus';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import { sendTextSms } from '../../../../sms';
import { meWatiSMS, usWatiSMS } from '../../../../../constants';

const TIMEOUT = 1000 * 60;

const getDays = (date) => {
  const then = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString();
  const now = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  return moment(then).diff(moment(now), 'days');
};

const USER_QUERY = (userId) => `
  query {
    user(id: "${userId}") {
      email
      name
      isBookSessionReminderSent
      createdAt
      country
      timezone
      phone {
        number
        countryCode
      }
      parentProfile {
        children {
          school {
            name
          }
          user {
            id
            name
          }
          batch {
            id
            campaign {
              type
              code
              title
              school {
                name
              }
            }
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

const schedule = {
  nextDaySessionReminder: () => {
    const oneDayAfter = moment().add(1, 'day').toDate();
    return new Date(oneDayAfter.setHours(17, 17, 0, 0));
  },
  firstFlow: {
    firstMail: (bookingDate) => new Date(moment(bookingDate).subtract(3, 'days').toDate().setHours(18, 3, 0, 0)),
    secondMail: (bookingDate) => new Date(moment(bookingDate).subtract(2, 'days').toDate().setHours(18, 11, 0, 0)),
    thirdMail: (slotNumber, bookingDate) => (slotNumber === 8 || slotNumber === 9
      ? new Date(moment(bookingDate).subtract(1, 'day').toDate().setHours(19, 49, 0, 0))
      : new Date(moment(bookingDate).toDate().setHours(slotNumber - 3, 0, 0, 0))),
  },
  secondFlow: (slotNumber, bookingDate) => {
    if (slotNumber === 8 || slotNumber === 9) {
      const oneDayBeforeBookingTime = moment(bookingDate).subtract(1, 'day').toDate();
      return new Date(oneDayBeforeBookingTime.setHours(19, 49, 0, 0));
    }
    return new Date(moment(bookingDate).toDate().setHours(slotNumber - 3, 0, 0, 0));
  },
  thirdFlow: {
    firstMail: (bookingDate) => new Date(moment(bookingDate).subtract(2, 'days').toDate().setHours(18, 11, 0, 0)),
    secondMail: (slotNumber, bookingDate) => (slotNumber === 8 || slotNumber === 9
      ? new Date(moment(bookingDate).subtract(1, 'day').toDate().setHours(19, 49, 0, 0))
      : new Date(moment(bookingDate).toDate().setHours(slotNumber - 2, 0, 0, 0))),
  },
  reminderWati: (slotNumber, bookingDate) => new Date(moment(bookingDate).toDate().setHours(slotNumber - 1, 30, 0, 0)),
};

const sendB2CNoEmail = (phone, country) => {
  if (country === 'india') {
    sendWhatsAppTemplateMessage(phone, 'demo_registration_confirmation1', phone, []);
  } else if (country === 'usa') {
    sendTextSms(`+${phone}`, usWatiSMS.trialRegistrationConfirmation);
  } else {
    sendTextSms(`+${phone}`, meWatiSMS.trialRegistrationConfirmation);
  }
};

const sendB2B2CNoEmail = (phone, schoolName, code, bookingLink, user, userId) => {
  sendWhatsAppTemplateMessage(phone, 'workshop_registration_4', schoolName, [
    { name: 'school_name', value: schoolName },
    { name: 'code', value: code },
    { name: 'booking_link', value: bookingLink },
  ]);
  addToSchedule('sendNextDayBookReminder', schedule.nextDaySessionReminder(), { userId, code });
};

const sendB2CWithEmail = (user, studentName, phone) => {
  const country = get(user, 'country');

  if (country === 'india') {
    sendWhatsAppTemplateMessage(phone, 'demo_registration_confirmation', phone, [
      { name: 'parent_name', value: user.name },
      { name: 'student_name', value: studentName },
    ]);
  } else if (country === 'usa') {
    sendTextSms(`+${phone}`, usWatiSMS.trialRegistrationConfirmation);
  } else {
    sendTextSms(`+${phone}`, meWatiSMS.trialRegistrationConfirmation);
  }

  if (country === 'usa') {
    sendTransactionalEmail({
      parentName: user.name,
      studentName,
      parentEmail: user.email,
    }, {
      emailTemplate: 'textWelcomeEmail',
      subject: `${studentName} is one step away from starting their coding journey!`,
    }, country);
  } else {
    sendTransactionalEmail({
      parentName: user.name,
      studentName,
      parentEmail: user.email,
    }, {
      emailTemplate: 'B2CRegistrationWithoutBooking',
      subject: `${studentName} is one step away from starting their coding journey!`,
    }, country);
  }
  addToSchedule('sendNextDayBookReminder', schedule.nextDaySessionReminder(), { userId, code });
};

const sendB2B2CWithEmail = (user, phone, parentName, studentName, code, schoolName, bookingLink, userId) => {
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
  addToSchedule('sendNextDayBookReminder', schedule.nextDaySessionReminder(), { userId, code });
};

const sendB2CUserWithBookingDate = async (user, userId, code, timeTable, parentName, studentName, schoolName, phone, menteeId) => {
  const { bookingDate, ...slots } = timeTable;
  const slotNumber = get(getSelectedSlotsTime(slots), '[0]');
  const { dateObject, startTime } = getIntlDateTime(bookingDate, slotNumber, get(user, 'timezone'));
  const sessionDate = moment(dateObject).format('dddd, Do MMMM');
  await updateBookSessionReminderStatus(get(user, 'id'), true);
  const country = get(user, 'country');
  if (country === 'usa') {
    sendTransactionalEmail({
      parentEmail: user.email,
      sessionDate,
      studentName,
      parentName,
      schoolName,
      startTime,
      phoneNumber: get(user, 'phone.countryCode') + get(user, 'phone.number'),
    }, {
      subject: `${studentName}'s free coding class is confirmed for ${sessionDate} ${startTime}`,
      emailTemplate: 'textWelcomeMailAfterBooking',
    }, get(user, 'country'));
  } else {
    sendTransactionalEmail({
      parentEmail: user.email,
      sessionDate,
      studentName,
      parentName,
      schoolName,
      startTime,
    }, {
      subject: `${studentName}'s free coding class is confirmed for ${sessionDate} ${startTime}`,
      emailTemplate: 'B2CRegistrationWithBooking',
    }, get(user, 'country'));
  }

  if (country === 'india') {
    const bookTemplate = 'demo_booking_confirmation';
    const parameters = [
      { name: 'parent_name', value: parentName },
      { name: 'student_name', value: studentName },
      { name: 'session_date', value: moment(bookingDate).format('dddd, Do MMMM') },
      { name: 'session_time', value: startTime },
      { name: 'school_name', value: schoolName },
    ];
    sendWhatsAppTemplateMessage(phone, bookTemplate, phone, parameters);
  } else if (country === 'usa') {
    sendTextSms(`+${phone}`, usWatiSMS.bookingConfirmation(studentName, `${moment(bookingDate).format('dddd, Do MMMM')}, ${startTime}`));
  } else {
    sendTextSms(`+${phone}`, meWatiSMS.bookingConfirmation(studentName, `${moment(bookingDate).format('dddd, Do MMMM')}, ${startTime}`));
  }

  // todo
  if (
    getDays(bookingDate) > 3
    || (getDays(bookingDate) === 3 && slotNumber <= 17)
  ) {
    addToSchedule('B2CEngagementMail', schedule.firstFlow.firstMail(bookingDate), { userId, menteeId });
    addToSchedule('B2CEngagementMailWithMentor', schedule.firstFlow.secondMail(bookingDate), { userId, menteeId });
    addToSchedule('B2CBookingFinalReminder', schedule.firstFlow.thirdMail(slotNumber, bookingDate), { userId, menteeId });
  } else if (getDays(bookingDate) === 0 || (getDays(bookingDate) === 1 && slotNumber <= 18)) {
    // if slot is book b/w less than 3 hours.
    if (getDays(bookingDate) === 0 && moment().hours() + 3 >= slotNumber) {
      sendB2B2CBookingReminder({ userId, menteeId, jobType: 'B2CBookingSameDayFinalReminder' }, () => {});
    } else {
      addToSchedule('B2CBookingSameDayFinalReminder', schedule.secondFlow(slotNumber, bookingDate), { userId, menteeId });
    }
  } else {
    addToSchedule('B2CEngagementMailWithMentor', schedule.thirdFlow.firstMail(bookingDate), { userId, menteeId });
    addToSchedule('B2CBookingFinalReminder', schedule.thirdFlow.secondMail(slotNumber, bookingDate), { userId, menteeId });
  }
  addToSchedule('B2CSessionReminderWati', schedule.reminderWati(slotNumber, bookingDate), { userId, menteeId });
};

const sendB2B2CWithBookingDate = async (user, userId, code, timeTable, parentName, studentName, schoolName, phone) => {
  const batchId = get(user, 'parentProfile.children[0].batch.id');
  if (get(user, 'isBookSessionReminderSent')) return;
  const { bookingDate, ...slots } = timeTable;
  const slotTime = Object.keys(slots).find((slot) => slots[slot]);
  await updateBookSessionReminderStatus(get(user, 'id'), true);

  sendTransactionalEmail({
    parentEmail: user.email,
    workshopDate: moment(bookingDate).format('dddd, Do MMMM'),
    studentName,
    parentName,
    schoolName,
    startTime: getSlotLabel(slotTime.replace('slot', '')).startTime,
    endTime: getSlotLabel(slotTime.replace('slot', '')).endTime.replace('00', '30'), // change this so that it can handle ::30
  }, {
    subject: `Here's ${studentName}'s Pass for Tekie Code Carnival`,
    emailTemplate: 'CarnivalEmailBookingFinal',
  });
  const bookTemplate = moment().diff(moment(get(user, 'createdAt'))) < TIMEOUT ? 'workshop_registration_confirmation1' : 'workshop_booking_confirmation';
  const slotNumber = Number(slotTime.replace('slot', ''));
  const parameters = moment().diff(moment(get(user, 'createdAt'))) < TIMEOUT
    ? [
      { name: 'parent_name', value: parentName },
      { name: 'student_name', value: studentName },
      { name: 'w_date', value: moment(bookingDate).format('dddd, Do MMMM') },
      { name: 'w_time', value: getSlotLabel(slotTime.replace('slot', '')).startTime },
      { name: 'school_name', value: schoolName },
    ] : [
      { name: 'parent_name', value: parentName },
      { name: 'student_name', value: studentName },
      { name: 'w_date', value: moment(bookingDate).format('dddd, Do MMMM') },
      { name: 'w_time', value: getSlotLabel(slotTime.replace('slot', '')).startTime },
    ];
  sendWhatsAppTemplateMessage(phone, bookTemplate, phone, parameters);
  if (
    getDays(bookingDate) > 3
    || (getDays(bookingDate) === 3 && slotNumber <= 17)
  ) {
    addToSchedule('engagementMail', schedule.firstFlow.firstMail(bookingDate), { userId, code, batchId });
    addToSchedule('engagementMailWithMentor', schedule.firstFlow.secondMail(bookingDate), { userId, code, batchId });
    addToSchedule('bookingFinalReminder', schedule.firstFlow.thirdMail(slotNumber, bookingDate), { userId, code, batchId });
  } else if (getDays(bookingDate) === 0 || (getDays(bookingDate) === 1 && slotNumber <= 18)) {
    // if slot is book b/w less than 3 hours.
    if (getDays(bookingDate) === 0 && moment().hours() + 3 >= slotNumber) {
      sendB2B2CBookingReminder({ userId, jobType: 'bookingSameDayFinalReminder' }, () => {});
    } else {
      addToSchedule('bookingSameDayFinalReminder', schedule.secondFlow(slotNumber, bookingDate), { userId, code, batchId });
    }
  } else {
    addToSchedule('engagementMailWithMentor', schedule.thirdFlow.firstMail(bookingDate), { userId, code, batchId });
    addToSchedule('bookingFinalReminder', schedule.thirdFlow.secondMail(slotNumber, bookingDate), { userId, code, batchId });
  }
  addToSchedule('sessionReminderWati', schedule.reminderWati(slotNumber, bookingDate), { userId, code, batchId });
};

// TODO: HANDLE CASE FOR SIBLINGS
// TODO: HANDLE FOR MULTIPLE BATCHES
const sendBookingReminderOrConfirmationB2BC = async (userId, isBookSlot = false) => {
  // If booking mail execute immediately or wait for TIMEOUT
  const timeout = isBookSlot ? 0 : TIMEOUT;
  setTimeout(async () => {
    const res = await callLocalGraphqlApi(USER_QUERY(userId));
    const user = get(res, 'data.user', {}) || {};
    const campaign = get(user, 'campaign.id')
      ? get(user, 'campaign', {})
      : get(user, 'parentProfile.children[0].batch.campaign', {});
    const schoolName = get(user, 'parentProfile.children[0].school.name')
      ? get(user, 'parentProfile.children[0].school.name')
      : get(campaign, 'school.name');
    const code = get(user, 'campaign.code', '');
    const bookingLink = `https://www.tekie.in/login?code=${code}`;
    const phone = get(user, 'phone.countryCode', '').replace('+', '') + get(user, 'phone.number', '');
    let isB2CUser = true;
    if (campaign.type) {
      isB2CUser = false;
    }
    if (schoolName) {
      isB2CUser = false;
    }
    const isB2B2CUser = campaign.type === 'b2b2cEvent';
    const studentId = get(user, 'parentProfile.children[0].user.id');

    const menteeSessions = await getMenteSessions(studentId);
    if (!user.email) {
      if (isB2CUser) {
        sendB2CNoEmail(phone, user.country);
      } else if (isB2B2CUser) {
        sendB2B2CNoEmail(phone, schoolName, code, bookingLink, user, userId);
      }
      return;
    }
    const parentName = get(user, 'name');
    const studentName = get(user, 'parentProfile.children[0].user.name');
    const timeTable = get(user, 'parentProfile.children[0].batch.b2b2ctimeTable', {});
    const hasBookedSession = isB2B2CUser ? !!get(timeTable, 'bookingDate') : menteeSessions.length > 0;
    if (hasBookedSession) {
      if (!isBookSlot) return;
      if (isB2CUser) {
        sendB2CUserWithBookingDate(user, studentId, code, get(menteeSessions, '[0]', {}), parentName, studentName, schoolName, phone, get(menteeSessions, '[0].id'));
      } else {
        sendB2B2CWithBookingDate(user, userId, code, timeTable, parentName, studentName, schoolName, phone);
      }
    } else {
      /* eslint-disable no-lonely-if */
      if (isB2CUser) {
        sendB2CWithEmail(user, studentName, phone);
      } else if (isB2B2CUser) {
        sendB2B2CWithEmail(user, phone, parentName, studentName, code, schoolName, bookingLink, userId);
      }
    }
  }, timeout);
};

export default sendBookingReminderOrConfirmationB2BC;
