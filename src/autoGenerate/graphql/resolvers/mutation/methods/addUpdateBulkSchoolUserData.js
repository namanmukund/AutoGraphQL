/* eslint-disable no-await-in-loop */
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
    mentor,
    bookingDate,
    slot,
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
        countryCode: countryAndCode[country],
        number: phoneNumber,
      },
      grade,
      section,
      rollNo,
      batch,
      branch,
      schoolName,
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
    topicConnectId:""
    menteeSessionConnectId:""
    mentorSessionConnectId:""
  ){
    id
  }
}

`;
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorMenteeSession.id');
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

const convertDateFormat = (date) => {
  const datearray = date.split('-');
  const newdate = `${datearray[1]}-${datearray[0]}-${datearray[2]}`;
  return newdate;
};

const addUpdateBulkSchoolUserData = async (root, params, context, info) => {
  validateAuthentication(context);
  const { sheetId, country = 'india', schoolName } = params;
  if (!sheetId || !schoolName) {
    throw new MissingMandatoryInputInRequestError();
  }
  const sheetDataRows = await getGoogleSpreadsheetData(sheetId);
  const firstTopic = await getFirstTopicAndLearningObjective();
  const firstTopicId = get(firstTopic, 'data.topics[0].id');
  const courseConnectId = await getCourseId();
  console.log('firstTopicId....', firstTopicId);
  console.log('courseConnectId....', courseConnectId);
  // eslint-disable-next-line no-restricted-syntax
  for (const row of sheetDataRows) {
    const result = await callParentChildSignup(row, schoolName, country);

    if (result && result.id) {
      const { bookingDate, slot, mentor } = row;
      let menteeSessionId;
      let mentorSessionId;
      // add mentee session
      if (bookingDate && slot) {
        const variables = {
          input: {
            bookingDate: convertDateFormat(bookingDate),
            [slot]: true,
          },
        };
        const userId = get(result, 'parentProfile.children.user.id');
        menteeSessionId = await callAddMenteeSession(userId, firstTopicId, variables);
        console.log('menteeSessionId.....', menteeSessionId);
      }
      // add mentor  session
      if (mentor) {
        const mentorUserId = await getMentorUserId(mentor);
        const variables = {
          input: {
            availabilityDate: convertDateFormat(bookingDate),
            [slot]: true,
            sessionType: 'trial',
          },
        };
        mentorSessionId = await callAddMentorSession(mentorUserId, courseConnectId, variables);
        console.log('mentorSessionId.....', mentorSessionId);
      }
      // add mentor mentee session
      if (menteeSessionId && mentorSessionId) {
        const variables = {
          input: {
            sessionStatus: 'allotted',
          },
        };
        const mentorMenteeSessionId = await callAddMentorMenteeSession(
          firstTopicId,
          menteeSessionId,
          mentorSessionId,
          variables,
        );
        console.log('mentorMenteeSessionId.....', mentorMenteeSessionId);
      }
    }
  }
  return [{ id: '123' }];
};

export default addUpdateBulkSchoolUserData;
