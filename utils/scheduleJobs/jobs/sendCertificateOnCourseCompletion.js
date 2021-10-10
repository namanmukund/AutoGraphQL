/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendCertificateToUser from '../../../src/email/messages/sendCertificateToUser';

const USER = (id) => `
  {
  user(id: "${id}") {
    id
    name
    studentProfile{
      profileAvatarCode
      parents{
        user{
          id
          email
        }
      }
      batch{
        allottedMentor{
          name
        }
      }
    }
  }
}
`;

/*
  called with child userId, fetches parent email and other variables to send certificate email
*/

const sendCertificateOnCourseCompletion = async ({ userId }, deleteJob) => {
  const userRes = await callLocalGraphqlApi(USER(userId));

  const parentEmail = get(userRes, 'data.user.studentProfile.parents[0].user.email');
  const studentName = get(userRes, 'data.user.name', '');
  const mentorName = get(userRes, 'data.user.studentProfile.batch.allottedMentor.name', '');
  const input = {
    studentName,
    mentorName
  };
  // change email here to test
  await sendCertificateToUser(parentEmail, input, 'backend');
  deleteJob();
};

export default sendCertificateOnCourseCompletion;
