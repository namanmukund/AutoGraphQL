import { get } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const deleteMenteeBookingLeadSquared = async (userInfo, topicInfo) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const topicOrder = get(topicInfo, 'data.topic.order');
  if (topicOrder === 1) {
    const leadSquaredInput = {
      Phone: phoneNumber,
      mx_Lead_Status: 'Pipeline',
      ProspectStage: 'Pipeline',
      mx_Booking_Date_Time: '',
    };
    updateLeadsquared(leadSquaredInput);
  }
};

export default deleteMenteeBookingLeadSquared;
