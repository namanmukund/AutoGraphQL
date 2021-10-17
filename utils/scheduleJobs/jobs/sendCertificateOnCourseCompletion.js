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

// query to fetch user course completion document on basis of id
const fetchUserCourseCompletion = (userId) => `
  query{
    userCourseCompletions(filter:{
      and:[
        {user_some: {id: "${userId}"}}
      ]
    }){
      id
      user {
        name
      }
      course {
        title
      }
      courseEndingDate
      journeySnapshot{
        id
        name
        uri
        signedUri
      }
    }
  }
  `;

/* eslint-disable-next-line no-confusing-arrow */
const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

/*
  called with child userId, fetches parent email and other variables to send certificate email
*/

const sendCertificateOnCourseCompletion = async ({ userId }, deleteJob) => {
  const userRes = await callLocalGraphqlApi(USER(userId));
  const fetchUserCourseCompletionRes = await callLocalGraphqlApi(fetchUserCourseCompletion(userId));
  const userCourseCompletionId = get(fetchUserCourseCompletionRes, 'data.userCourseCompletions[0].id');
  const userCourseCompletionIdSlug = slugifyID(userCourseCompletionId);
  const parentEmail = get(userRes, 'data.user.studentProfile.parents[0].user.email');
  const studentName = get(userRes, 'data.user.name', '');
  const mentorName = get(userRes, 'data.user.studentProfile.batch.allottedMentor.name', '');
  const input = {
    studentName,
    mentorName,
    userCourseCompletionIdSlug,
  };
  // change email here to test
  await sendCertificateToUser(parentEmail, input, 'backend');
  deleteJob();
};

export default sendCertificateOnCourseCompletion;
