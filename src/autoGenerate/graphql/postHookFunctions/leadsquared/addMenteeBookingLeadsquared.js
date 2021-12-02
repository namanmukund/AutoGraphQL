import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { fetchAgentName } from '../utils/updateUserBookingAgent';

const getUser = async (phoneNumber) => {
  const user = await callLocalGraphqlApi(`{
    users(filter: { phone_number_subDoc: "${phoneNumber}" }) {
      timezone
    }
  }`);
  return get(user, 'data.users[0]', {});
};

const addMenteeBookingLeadsquared = async (input, params, slotTimeStringArray, userInfo, topicInfo, isBookedByMentee, agentId, fields = {}) => {
  const { bookingDate } = input;
  let phoneNumber = input.phone;
  let bookingDateTime = '';
  let bookingDateTimeISO = '';
  let date = '';
  let time = '';
  let timezone = 'Asia/Kolkata';
  if (get(input, 'type') === 'b2b2c') {
    const { slot, phone } = input;
    phoneNumber = phone;
    const user = await getUser(phoneNumber);
    timezone = get(user, 'timezone');
    const { dateObject, startTime } = getIntlDateTime(bookingDate, slot, timezone);
    date = moment(dateObject).format('dddd, Do MMMM, YYYY');
    time = startTime;
    bookingDateTime = moment(bookingDate).minutes(0).hours(slot).subtract(5, 'hours')
      .subtract(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    bookingDateTimeISO = moment(bookingDate).toISOString();
  } else {
    phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
    const user = await getUser(phoneNumber);
    timezone = get(user, 'timezone');
    const topicOrder = get(topicInfo, 'data.topic.order');
    if (topicOrder === 1) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      const { dateObject, startTime } = getIntlDateTime(bookingDate, slotNumber, timezone);
      date = moment(dateObject).format('dddd, Do MMMM, YYYY');
      time = startTime;
      bookingDateTime = moment(bookingDate).minutes(0).hours(slotNumber).subtract(5, 'hours')
        .subtract(30, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss');
      bookingDateTimeISO = moment(bookingDate).toISOString();
    }
  }

  const agentName = await fetchAgentName(agentId);
  const now = moment()
    .subtract(5, 'hours')
    .subtract(30, 'minutes')
    .format('YYYY-MM-DD HH:mm:ss');
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Booking_Date_Time: bookingDateTime,
    mx_Booking_Date: date,
    mx_Booking_Time: time,
    mx_Last_updated_booking: now,
    mx_ISO_Booking_Date_Time: bookingDateTimeISO,
    ...fields,
  };
  if (!isBookedByMentee && agentName) {
    leadSquaredInput.mx_Booking_Agent = agentName;
  }
  if (input.sessionLink) {
    leadSquaredInput.mx_Demo_Session_Link = input.sessionLink;
  }
  if (input.mx_Meeting_ID) {
    leadSquaredInput.mx_Meeting_ID = input.mx_Meeting_ID;
  }
  if (input.mx_Meeting_Password) {
    leadSquaredInput.mx_Meeting_Password = input.mx_Meeting_Password;
  }
  const activityInput = {
    ActivityEvent: 103,
    ActivityNote: !isBookedByMentee ? 'Agent booked a session' : 'User booked a session',
    Fields: [
      {
        SchemaName: 'Status',
        Value: !isBookedByMentee ? 'Booked (Verified)' : 'Booked (Non Verified)',
      },
      {
        SchemaName: 'mx_Custom_3',
        Value: !isBookedByMentee ? 'Tekie Team' : 'Customer',
      },
      {
        SchemaName: 'mx_Custom_8',
        Value: bookingDateTime,
      },
      {
        SchemaName: 'mx_Custom_12',
        Value: now,
      },
    ],
  };
  updateLeadsquared(leadSquaredInput, false, activityInput);
};

export default addMenteeBookingLeadsquared;
