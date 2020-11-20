import { get } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const setSessionStartedLeadsquared = async (userInfo, topicInfo) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const topicOrder = get(topicInfo, 'data.topic.order');
  if (topicOrder === 1) {
    const leadSquaredInput = {
      Phone: phoneNumber,
      mx_Session_Started: 'Yes',
    };
    updateLeadsquared(leadSquaredInput);
  }
};

export default setSessionStartedLeadsquared;
