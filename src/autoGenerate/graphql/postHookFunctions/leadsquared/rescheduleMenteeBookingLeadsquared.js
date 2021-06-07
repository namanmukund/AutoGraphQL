import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const rescheduleMenteeBookingLeadsquared = async (input, slotTimeStringArray, userInfo, topicInfo) => {
  const { bookingDate, bookedBy } = input;
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const topicOrder = get(topicInfo, 'data.topic.order');
  if (topicOrder === 1) {
    const slotNumber = slotTimeStringArray[0].split('slot')[1];
    const bookingDateTime = moment(bookingDate).minutes(0).hours(slotNumber).subtract(5, 'hours')
      .subtract(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
    const leadSquaredInput = {
      Phone: phoneNumber,
      mx_Booking_Date_Time: bookingDateTime,
    };
    const activityInput = {
      ActivityEvent: 103,
      ActivityNote: bookedBy === 'tekieTeam' ? 'Agent updated session details' : 'User rescheduled a session',
      Fields: [
        {
          SchemaName: 'Status',
          Value: bookedBy === 'tekieTeam' ? 'Booked (Verified)' : 'Booked (Non Verified)',
        },
        {
          SchemaName: 'mx_Custom_8',
          Value: bookingDateTime,
        },
      ],
    };
    updateLeadsquared(leadSquaredInput, false, activityInput);
  }
};

export default rescheduleMenteeBookingLeadsquared;
