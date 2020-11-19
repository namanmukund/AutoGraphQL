import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const setSessionCompletedLeadsquared = async (userInfo) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Lead_Status: 'Session Taken',
    ProspectStage: 'Session Taken',
    mx_Session_Taken_Date_Time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
  };
  console.log(leadSquaredInput)
  updateLeadsquared(leadSquaredInput);
};

export default setSessionCompletedLeadsquared;
