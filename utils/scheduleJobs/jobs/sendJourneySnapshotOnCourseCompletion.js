/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import { sendJourneySnapshotToUser } from '../../../src/email/messages';

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
    }
  }
}
`;

// query to fetch user approved codes and reaction counts to determine shorter/longer template to choose
const fetchUserApprovedCodes = (userId) => `
  query{
    userApprovedCodes(filter: {
      user_some:{id: "${userId}"}
    }){
      id
      totalReactionCount
    }
    userSavedCodes(filter: {
      user_some:{id: "${userId}"}
    }){
      id
    }
    userPracticeQuestionReportsMeta(filter: {
      user_some:{id: "${userId}"}
    }){
      count
    }
    userQuizReportsMeta(filter: {
      user_some: {id: "${userId}"}
    }){
      count
    }
  }
  `;

/*
  called with child userId, fetches parent email and other variables to send journey snapshot email
*/

const sendJourneySnapshotOnCourseCompletion = async ({ userId }, deleteJob) => {
  const userRes = await callLocalGraphqlApi(USER(userId));

  const parentEmail = get(userRes, 'data.user.studentProfile.parents[0].user.email');
  const studentName = get(userRes, 'data.user.name', '');
  // Add default avatar code in get
  const avatarCode = get(userRes, 'data.user.studentProfile.profileAvatarCode', 'auli');

  const fetchUserApprovedCodesRes = await callLocalGraphqlApi(fetchUserApprovedCodes(userId));
  let useLongerTemplate = false;

  // fetch data and pass to insert into html
  const userApprovedCodes = get(fetchUserApprovedCodesRes, 'data.userApprovedCodes', []);
  const userSavedCodes = get(fetchUserApprovedCodesRes, 'data.userSavedCodes', []);
  const userPqCount = get(fetchUserApprovedCodesRes, 'data.userPracticeQuestionReportsMeta.count', 0);
  const userQuizReportsMeta = get(fetchUserApprovedCodesRes, 'data.userPracticeQuestionReportsMeta.count', 0);
  const totalPqCountToDisplay = userPqCount + userQuizReportsMeta;

  if (userApprovedCodes && userApprovedCodes.length > 0) {
    useLongerTemplate = true;
  }
  const templateToFetch = useLongerTemplate ? 'JourneySnapshot-1' : 'JourneySnapshot-2';
  const input = {
    userApprovedCodes,
    userSavedCodes,
    totalPqCountToDisplay,
    templateToFetch,
    studentName,
    avatarCode,
  };
  // change email here to test
  console.log('parentEmail', parentEmail);
  await sendJourneySnapshotToUser(parentEmail, input, 'backend');
  deleteJob();
};

export default sendJourneySnapshotOnCourseCompletion;
