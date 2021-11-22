import { get } from 'lodash';
// import updateLeadSquared from '../../../../../../services/leadsquared/updateLeadSquared';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getCountryCodeAndNumber from '../../../validation/getCountryCodeAndNumber';
import { RESPONSES } from '../typeformResponses';
import generateCertificateScript from './generateCertificateScript';

const getEventId = (formId) => {
  let eventId = '';
  switch (formId) {
    case 'm47rmq7f':
      eventId = 'ckvdiavp70000igujfgxh8mt6';
      if (process.env.NODE_ENV === 'production') {
        eventId = 'ckve5izxq0000ucui47b89pmf';
        if (process.env.DATA_MASKING) {
          eventId = 'ckve5fm7o00090t1dd1v4dy13';
        }
      }
      break;
    case 'N5rTz2zX':
      eventId = 'ckvw6s3df000039in32ewhy89';
      if (process.env.NODE_ENV === 'production') {
        eventId = 'ckvxsrwlb001c0usf9lxwapt4';
        if (process.env.DATA_MASKING) {
          eventId = 'ckvwncjv400001sin0ppigr3s';
        }
      }
      break;
    default:
      eventId = 'ckvdiavp70000igujfgxh8mt6';
      if (process.env.NODE_ENV === 'production') {
        eventId = 'ckve5izxq0000ucui47b89pmf';
        if (process.env.DATA_MASKING) {
          eventId = 'ckve5fm7o00090t1dd1v4dy13';
        }
      }
      break;
  }
  return eventId;
};

const updateEventAttendanceStatus = async (eventAttendanceId) => {
  const query = `mutation {
  updateEventAttendance(id: "${eventAttendanceId}", input: { attendance: present }) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.updateEventAttendance');
};

const addNewEventAttendanceWithStatus = async (userId, studentProfileId, eventId) => {
  const query = `mutation {
  addEventAttendance(
    input: { attendance: present }
    userConnectId: "${userId}"
    studentProfileConnectId: "${studentProfileId}"
    eventConnectId: "${eventId}"
  ) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.addEventAttendance');
};

const getEventAttendances = async (userId, eventId) => {
  const query = `{
  eventAttendances(
    filter: { and: [{ user_some: { id: "${userId}" } }, { event_some: { id: "${eventId}" } }] }
  ) {
    id
  }
}
`;
  return get(await callLocalGraphqlApi(query), 'data.eventAttendances', []);
};

const usersData = async (studentDetailsObject, formId) => {
  let filter = '';
  const {
    childName, parentEmail = '', parentPhone: { number = '' },
  } = studentDetailsObject;
  if (number) {
    filter = `{
      and: [
        {studentProfile_some: {
        parents_some: {
          user_some:{
            and:[
              {phone_number_subDoc: "${number}"}
            ]
          }
        }
      }}
      ]
    }`;
    const numberQuery = `{
    users(
      filter: ${filter}
    ) {
      id
      studentProfile{
        id
      }
    }
  }`;
    const users = get(await callLocalGraphqlApi(numberQuery), 'data.users', []);
    // uses the same formId parameter passed from controller, to generate eventId dynamically
    if (users && users.length) {
      const eventAttendances = await getEventAttendances(get(users, '[0].id'), getEventId(formId));
      if (eventAttendances && eventAttendances.length) {
        log(`updating attendance for ${childName} with id ${get(users, '[0].id')}`);
        await updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
        generateCertificateScript([get(users, '[0].id')], false, getEventId(formId), '2021-11-12T18:30:00.000Z');
      } else {
        log(`adding attendance for ${childName} with id ${get(users, '[0].id')}`);
        await addNewEventAttendanceWithStatus(get(users, '[0].id'), get(users, '[0].studentProfile.id'), getEventId(formId));
        generateCertificateScript([get(users, '[0].id')], false, getEventId(formId), '2021-11-12T18:30:00.000Z');
      }
    } else if (parentEmail) {
      filter = `{
        and: [
          {studentProfile_some: {
          parents_some: {
            user_some: {email:"${parentEmail.trim()}"}
          }
        }}
        ]
      }`;
      const query = `{
      users(
        filter: ${filter}
      ) {
        id
        studentProfile{
          id
        }
      }
    }`;
      const user = get(await callLocalGraphqlApi(query), 'data.users', []);
      if (user && user.length) {
        const eventAttendances = await getEventAttendances(get(user, '[0].id'), getEventId(formId));
        if (eventAttendances && eventAttendances.length) {
          log(`updating attendance for ${childName} with id ${get(user, '[0].id')}`);
          await updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
          generateCertificateScript([get(user, '[0].id')], false, getEventId(formId), '2021-11-12T18:30:00.000Z');
        } else {
          log(`adding attendance for ${childName} with id ${get(user, '[0].id')}`);
          await addNewEventAttendanceWithStatus(get(user, '[0].id'), get(user, '[0].studentProfile.id'), getEventId(formId));
          generateCertificateScript([get(user, '[0].id')], false, getEventId(formId), '2021-11-12T18:30:00.000Z');
        }
      } else {
        const parentChildSignUpQuery = `mutation parentChildSignUp($input: ParentChildSignUpInput) {
        parentChildSignUp(input: $input) {
          id
          name
          email
          parentProfile {
            id
            children {
              id
              grade
              user {
                id
                name
              }
            }
          }
        }
      }
      `;
        log(`creating a parentChildSignUp for ${childName}`);
        const result = await callLocalGraphqlApi(parentChildSignUpQuery, '', { input: studentDetailsObject });
        if (get(result, 'data.parentChildSignUp')) {
          const children = get(result, 'data.parentChildSignUp.parentProfile.children');
          // eslint-disable-next-line no-restricted-syntax
          for (const child of children) {
            log(`got added child for ${get(child, 'user.name')}`);
            if (get(child, 'user.name') === childName) {
              // adding attendance for only that child how filled the form
              log(`adding attendance for ${childName} with id ${get(child, 'user.id')}`);
              // eslint-disable-next-line no-await-in-loop
              await addNewEventAttendanceWithStatus(get(child, 'user.id'), get(child, 'id'), getEventId(formId));
              generateCertificateScript([get(child, 'user.id')], false, getEventId(formId), '2021-11-12T18:30:00.000Z');
            }
          }
        }
      }
    }
  }
};

const eventResponsesToLeadsquaredScript = async () => {
  const userArray = RESPONSES;

  if (userArray && userArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userObj of userArray) {
      let studentDetailsObject = {};
      studentDetailsObject.childName = get(userObj, 'StudentName');
      studentDetailsObject.parentName = get(userObj, 'ParentName');
      studentDetailsObject.parentEmail = get(userObj, 'Email');
      studentDetailsObject.grade = `Grade${get(userObj, 'Grade')}`;
      studentDetailsObject.parentPhone = getCountryCodeAndNumber(get(userObj, 'Phone'));

      const country = 'india';
      const timezone = 'Asia/Kolkata';
      const utmSource = 'communityevent';
      const utmCampaign = 'spysquadcamp_13nov';

      studentDetailsObject = {
        ...studentDetailsObject,
        country,
        timezone,
        utmSource,
        utmCampaign,
      };

      const formId = 'm47rmq7f';

      // eslint-disable-next-line no-await-in-loop
      await usersData(studentDetailsObject, formId);
    }
  }
};

export default eventResponsesToLeadsquaredScript;
