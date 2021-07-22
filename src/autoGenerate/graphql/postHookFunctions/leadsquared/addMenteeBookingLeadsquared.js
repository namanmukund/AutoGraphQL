import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';
import { fetchAgentName } from '../utils/updateUserBookingAgent';

const addMenteeBookingLeadsquared = async (input, params, slotTimeStringArray, userInfo, topicInfo, isBookedByMentee, agentId) => {
  const { bookingDate } = input;
  let phoneNumber = '';
  let bookingDateTime = '';
  if (get(input, 'type') === 'b2b2c') {
    const { slot, phone } = input;
    phoneNumber = phone;
    bookingDateTime = moment(bookingDate).minutes(0).hours(slot).subtract(5, 'hours')
      .subtract(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
  } else {
    phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
    const topicOrder = get(topicInfo, 'data.topic.order');
    if (topicOrder === 1) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      bookingDateTime = moment(bookingDate).minutes(0).hours(slotNumber).subtract(5, 'hours')
        .subtract(30, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss');
    }
  }

  const agentName = await fetchAgentName(agentId);

  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Booking_Date_Time: bookingDateTime,
  };
  if (!isBookedByMentee && agentName) {
    leadSquaredInput.mx_Booking_Agent = agentName;
  }
  if (input.sessionLink) {
    leadSquaredInput.mx_Session_Link = input.sessionLink;
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
    ],
  };
  updateLeadsquared(leadSquaredInput, false, activityInput);
};

export default addMenteeBookingLeadsquared;
