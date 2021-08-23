import { get } from 'lodash';
import { DEFAULT_LS_OM_USER_ID } from '../../../../../constants';
import updateLeadSquared from '../../../../../services/leadsquared/updateLeadSquared';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
// import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
// import sendTransactionalEmail from '../../resolvers/utils/sendTransactionalEmail';

const BATCH_SESSION = (batchSessionId) => `{
  batchSession(id: "${batchSessionId}") {
    topic {
      order
    }
    batch {
      allottedMentor {
        name
        mentorProfile {
          salesExecutive {
            id 
            email
            user {
              name
            }
          }
        }
      }
    }
    attendance {
      isPresent
      status
      student {
        id
        user {
          name
        }
        parents{
          user {
            name
            email
            phone {
              countryCode
              number
            }
            campaign {
              type
            }
          }
        }
      }
    }
  }
}`;

// TODO : HANDLE FOR NORMAL BATCH TRIAL
const extractBatchSessionAndPostCarnival = async ({ batchSessionId }, deleteJob, ls = false) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  // Don't proceed if it is not the first topic
  deleteJob();
  if (get(batchSessionRes, 'data.batchSession.topic.order') !== 1) return;

  const attendances = get(batchSessionRes, 'data.batchSession.attendance', []);
  const mentorName = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.name', '');
  const salesExec = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.salesExecutive.user.name', '');
  const salesExecEmail = get(batchSessionRes, 'data.batchSession.batch.allottedMentor.mentorProfile.salesExecutive.user.email', '');
  attendances.forEach(async (attendance) => {
    const attendanceStatus = get(attendance, 'status', 'notAssigned');
    const student = get(attendance, 'student', {});
    // const studentName = get(student, 'user.name');
    // const parentName = get(student, 'parents[0].user.name');
    // const parentEmail = get(student, 'parents[0].user.email');
    const parentPhone = get(student, 'parents[0].user.phone.number');
    // const countryCode = get(student, 'parents[0].user.phone.countryCode', '').replace('+', '');
    let leadSquaredInput = {};
    let activityInput = {};
    if (attendanceStatus === 'present') {
      if (!ls) {
        // sendTransactionalEmail({
        //   studentName,
        //   parentEmail,
        // }, {
        //   emailTemplate: 'PostCarnivalFeedback',
        //   subject: `${studentName}, did you enjoy the Code Jam?`,
        // });
        // sendWhatsAppTemplateMessage(countryCode + parentPhone, 'workshop_post_demo', parentName, [{
        //   name: 'parent_name',
        //   value: parentName,
        // }, {
        //   name: 'student_name',
        //   value: studentName,
        // }]);
      }
      leadSquaredInput = {
        Phone: parentPhone,
        mx_Demo_Attendance: 'Present',
        mx_Mentor_Name: mentorName,
      };
      if (salesExec) {
        leadSquaredInput.mx_Success_Manager_Name = salesExec;
      }

      const res = await fetch(`https://api-in21.leadsquared.com/v2/UserManagement.svc/User/Retrieve/ByEmailAddress?accessKey=${process.env.LEAD_SQUARED_ACCESS_KEY}&secretKey=${process.env.LEAD_SQUARED_SECRET_KEY}&emailAddress=${salesExecEmail}`);
      const data = await res.json();
      if (get(data, '0.UserId')) {
        leadSquaredInput.OwnerId = get(data, '0.UserId');
      } else {
        // Default to Om Dubey User Id, if Sales Manager not found on LS
        leadSquaredInput.OwnerId = DEFAULT_LS_OM_USER_ID;
      }

      activityInput = {
        ActivityEvent: 105,
        ActivityNote: 'Student attended the demo',
        Fields: [
          {
            SchemaName: 'Status',
            Value: 'Demo Completed',
          },
          {
            SchemaName: 'mx_Custom_2',
            Value: 'Present',
          },
        ],
      };
    } else {
      leadSquaredInput = {
        Phone: parentPhone,
        mx_Demo_Attendance: 'Absent',
        Status: 'Reschedule',
        ProspectStage: 'Reschedule',
      };
      activityInput = {
        ActivityEvent: 103,
        ActivityNote: 'Student did not attend',
        Fields: [
          {
            SchemaName: 'Status',
            Value: 'Reschedule',
          },
          {
            SchemaName: 'mx_Custom_10',
            Value: 'Absent',
          },
        ],
      };
    }
    if (ls) {
      updateLeadSquared(leadSquaredInput, false, activityInput);
    }
  });
};

export default extractBatchSessionAndPostCarnival;
