import { get } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const deleteMenteeBookingLeadSquared = async (userInfo, topicInfo, isBookedByStudent) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const topicOrder = get(topicInfo, 'data.topic.order');
  if (topicOrder === 1) {
    const leadSquaredInput = {
      Phone: phoneNumber,
      mx_Lead_Status: 'Pipeline',
    };
    const activityInput = {
      ActivityEvent: 103,
      ActivityNote: isBookedByStudent ? 'User deleted a session' : 'Agent deleted a session',
      Fields: [
        {
          SchemaName: 'Status',
          Value: 'Pipeline',
        },
      ],
    };
    updateLeadsquared(leadSquaredInput, false, activityInput);
  }
};

export default deleteMenteeBookingLeadSquared;
