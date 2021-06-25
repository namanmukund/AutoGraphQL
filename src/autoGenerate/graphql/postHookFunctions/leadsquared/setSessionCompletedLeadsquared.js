import { get } from 'lodash';
import moment from 'moment';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const setSessionCompletedLeadsquared = async (userInfo, mentorName, salesExec) => {
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Session_Taken_Date_Time: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    mx_Success_Manager_Name: salesExec,
    mx_Mentor_Name: mentorName,
  };
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
