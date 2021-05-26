import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const addMenteeBookingLeadsquared = async (input, params, slotTimeStringArray, userInfo, topicInfo) => {
  let bookingDateTime = '';
  let phoneNumber = '';
  if (get(input, 'type') === 'b2b2c') {
    const { bookingDate, slot, phone } = input;
    phoneNumber = phone;
    bookingDateTime = moment(bookingDate).minutes(0).hours(slot).subtract(5, 'hours')
      .subtract(30, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');
  } else {
    const { bookingDate } = input;
    phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
    const topicOrder = get(topicInfo, 'data.topic.order');
    if (topicOrder === 1) {
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      bookingDateTime = moment(bookingDate).minutes(0).hours(slotNumber).subtract(5, 'hours')
        .subtract(30, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss');
    }
  }
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Lead_Status: 'Booked',
    ProspectStage: 'Booked',
    mx_Booking_Date_Time: bookingDateTime,
  };
  updateLeadsquared(leadSquaredInput);
};

export default addMenteeBookingLeadsquared;
