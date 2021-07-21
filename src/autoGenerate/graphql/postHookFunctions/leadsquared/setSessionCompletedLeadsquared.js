import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const setSessionCompletedLeadsquared = async (userInfo, mentorName, salesExec, salesExecEmail) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Session_Taken_Date_Time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    mx_Mentor_Name: mentorName,
  };

  const res = await fetch(`https://api-in21.leadsquared.com/v2/UserManagement.svc/User/Retrieve/ByEmailAddress?accessKey=${process.env.LEAD_SQUARED_ACCESS_KEY}&secretKey=${process.env.LEAD_SQUARED_SECRET_KEY}&emailAddress=${salesExecEmail}`);
  const data = await res.json();
  if (salesExec) {
    leadSquaredInput.mx_Success_Manager_Name = salesExec;
  }
  if (get(data, '0.UserId')) {
    leadSquaredInput.OwnerId = get(data, '0.UserId');
  }
  const activityInput = {
    ActivityEvent: 105,
    Fields: [
      {
        SchemaName: 'Status',
        Value: 'Demo Completed',
      },
    ],
  };
  updateLeadsquared(leadSquaredInput, false, activityInput);
};

export default setSessionCompletedLeadsquared;
