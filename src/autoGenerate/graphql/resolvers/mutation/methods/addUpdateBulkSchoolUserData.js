/* eslint-disable no-await-in-loop, no-console */
import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import getGoogleSpreadsheetData from '../../../../../../utils/getGoogleSpreadsheetData';
import countryAndCode from '../../../../../../constants/countryAndCode';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';

const callParentChildSignup = async (row, schoolName, country) => {
  const {
    childName,
    parentName,
    rollNo,
    parentEmail,
    phoneNumber,
    grade,
    section,
    branch,
    batch,
    parentPassword,
  } = row;
  const query = `
mutation($input: ParentChildSignUpInput){
  parentChildSignUp(input: $input){
    id
    parentProfile{
      id
      children{
        id
        school{
          id
          name
        }
        user{
          id
        }
      }
    }
  }
}
`;
  const variables = {
    input: {
      parentName,
      childName,
      parentEmail,
      parentPhone: {
        countryCode: phoneNumber && countryAndCode[country],
        number: phoneNumber,
      },
      grade,
      section,
      rollNo,
      batch,
      branch,
      schoolName,
      parentPassword,
    },
  };

  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.parentChildSignUp');
};

const callAddMenteeSession = async (
  userConnectId,
  topicConnectId,
  variables,
) => {
  const query = `
mutation ($input: MenteeSessionInput!) {
  addMenteeSession(
    input: $input, 
    userConnectId: "${userConnectId}", 
    topicConnectId: "${topicConnectId}"
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMenteeSession.id');
};

const getMentorSessionId = async (
  mentorUserId,
  availabilityDate,
) => {
  const query = `
query {
  mentorSessions(filter:{
    and:[
      {user_some:{id:"${mentorUserId}"}}
      {availabilityDate: "${availabilityDate}"}
      {sessionType: trial}
    ]
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorSessions[0].id');
};

const callAddMentorSession = async (
  userConnectId,
  courseConnectId,
  variables,
) => {
  const query = `
mutation ($input: MentorSessionInput!) {
  addMentorSession(input: $input, 
    userConnectId: "${userConnectId}", 
    courseConnectId: "${courseConnectId}"
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorSession.id');
};

const callAddMentorMenteeSession = async (
  topicConnectId,
  menteeSessionConnectId,
  mentorSessionConnectId,
  variables,
) => {
  const query = `
mutation($input: MentorMenteeSessionInput!){
  addMentorMenteeSession(
    input:$input
    topicConnectId:"${topicConnectId}"
    menteeSessionConnectId:"${menteeSessionConnectId}"
    mentorSessionConnectId:"${mentorSessionConnectId}"
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorMenteeSession.id');
};

const callUpdateMentorSession = async (
  mentorSessionId,
  variables,
) => {
  const query = `
mutation($input: MentorSessionUpdate){
  updateMentorSession(
    id:"${mentorSessionId}",
    input:$input
  ){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorSession.id');
};

const getMentorUserId = async (
  username,
) => {
  const query = `
query{
  users(filter:{
    and:[
      {role:mentor}
      {username:"${username}"}
    ]
  }){
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.users[0].id');
};

const getCourseId = async () => {
  const query = `
{
  courses(
    filter:{
      status:published
    }
    orderBy: order_ASC
  ) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.courses[0].id');
};
/*
const updateUserPassword = async (userId, variables) => {
  const query = `
    mutation($input: UserUpdate){
      updateUser(id:"${userId}", input:$input){
        id
        isSetPassword
      }
    }
`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateUser');
};
 */

const convertDateFormat = (date) => {
  const datearray = date.split('-');
  const newdate = `${datearray[1]}-${datearray[0]}-${datearray[2]}`;
  return newdate;
};

const addUpdateBulkSchoolUserData = async (root, params, context) => {
  validateAuthentication(context);
  const {
    sheetId, country = 'india', schoolName, booking = false, setPassword = false,
  } = params;
  if (!sheetId || !schoolName) {
    throw new MissingMandatoryInputInRequestError();
  }
  const sheetDataRows = await getGoogleSpreadsheetData(sheetId);
  const firstTopic = await getFirstTopicAndLearningObjective();
  const firstTopicId = get(firstTopic, 'data.topics[0].id');
  const courseConnectId = await getCourseId();
  const errorLogs = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [index, row] of sheetDataRows.entries()) {
    try {
      console.log('Processing row number........', index + 2);
      /*
temp code
      // if (row.userId) {
      //   console.log('For userID........', row.userId);
      //   const res = await updateUserPassword(row.userId, {
      //     input: {
      //       email: row.studentEmail && row.studentEmail.trim().toLowerCase(),
      //       password: row.studentEmail && row.studentEmail.trim().toLowerCase().split('@')[0],
      //     },
      //   });
      //   console.log('....', res);
      // }

       */

      if (setPassword) {
        row.parentPassword = row.parentEmail && row.parentEmail.trim().toLowerCase().split('@')[0];
      }
      const result = await callParentChildSignup(row, schoolName, country);

      if (booking && result && result.id) {
        console.log('Parent  Id....', result.id);
        const { bookingDate, slot, mentor } = row;
        let menteeSessionId;
        let mentorSessionId;
        // add mentee session
        if (bookingDate && slot) {
          const variables = {
            input: {
              bookingDate: convertDateFormat(bookingDate),
              [slot]: true,
              source: 'school',
            },
          };
          const userId = get(result, 'parentProfile.children[0].user.id');
          menteeSessionId = await callAddMenteeSession(userId, firstTopicId, variables);
          console.log('menteeSessionId....', menteeSessionId);
        }
        // add mentor  session
        if (mentor) {
          const mentorUserId = await getMentorUserId(mentor);
          console.log('mentorUserId....', mentorUserId);
          if (mentorUserId) {
            mentorSessionId = await getMentorSessionId(
              mentorUserId,
              convertDateFormat(bookingDate),
              slot,
            );
            if (!mentorSessionId) {
              const variables = {
                input: {
                  availabilityDate: convertDateFormat(bookingDate),
                  [slot]: true,
                  sessionType: 'trial',
                },
              };
              mentorSessionId = await callAddMentorSession(mentorUserId, courseConnectId, variables);
            } else {
              // update
              const variables = {
                input: {
                  availabilityDate: convertDateFormat(bookingDate),
                  [slot]: true,
                },
              };
              await callUpdateMentorSession(
                mentorSessionId,
                variables,
              );
            }
          }
        }
        console.log('mentorSessionId....', mentorSessionId);
        // add mentor mentee session
        if (menteeSessionId && mentorSessionId) {
          const variables = {
            input: {
              sessionStatus: 'allotted',
              source: 'school',
            },
          };
          await callAddMentorMenteeSession(
            firstTopicId,
            menteeSessionId,
            mentorSessionId,
            variables,
          );
          console.log('Processed........', index + 2, result.id);
        }
      }
    } catch (e) {
      console.log('Error........', e);
      errorLogs.push({
        sheetRow: index + 2,
        parentEmail: row.parentEmail,
        childName: row.childName,
        parentName: row.parentName,
        phoneNumber: row.phoneNumber,
        error: e,
      });
    }
  }
  return {
    status: 'completed',
    errorLogs,
  };
};

export default addUpdateBulkSchoolUserData;
