import { get } from 'lodash';
import { log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import generateCertificateScript from '../autoGenerate/graphql/resolvers/query/scriptMethods/generateCertificateScript';
import getCountryCodeAndNumber from '../autoGenerate/graphql/validation/getCountryCodeAndNumber';
import getHashDigest from './typeform-utils/getHashDigest';

const getEventId = () => {
  let eventId = 'ckvdiavp70000igujfgxh8mt6';
  if (process.env.NODE_ENV === 'production') {
    eventId = 'ckve5izxq0000ucui47b89pmf';
    if (process.env.DATA_MASKING) {
      eventId = 'ckve5fm7o00090t1dd1v4dy13';
    }
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

const usersData = async (studentDetailsObject) => {
  let filter = '';
  const {
    childName, parentEmail = '', parentPhone: { number = '' },
  } = studentDetailsObject;
  if (number) {
    filter = `{studentProfile_some: {
        parents_some: {
          user_some:{
            and:[
              {phone_number_subDoc: "${number}"}
            ]
          }
        }
      }}`;
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
    if (users && users.length) {
      const eventAttendances = await getEventAttendances(get(users, '[0].id'), getEventId());
      if (eventAttendances && eventAttendances.length) {
        log(`updating attendance for ${childName} with id ${get(users, '[0].id')}`);
        updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
        generateCertificateScript([get(users, '[0].id')]);
      } else {
        log(`adding attendance for ${childName} with id ${get(users, '[0].id')}`);
        addNewEventAttendanceWithStatus(get(users, '[0].id'), get(users, '[0].studentProfile.id'), getEventId());
        generateCertificateScript([get(users, '[0].id')]);
      }
    } else if (parentEmail) {
      filter = `{studentProfile_some: {
          parents_some: {
            user_some: {email:"${parentEmail.trim()}"}
          }
        }}`;
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
        const eventAttendances = await getEventAttendances(get(user, '[0].id'), getEventId());
        if (eventAttendances && eventAttendances.length) {
          log(`updating attendance for ${childName} with id ${get(user, '[0].id')}`);
          updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
          generateCertificateScript([get(user, '[0].id')]);
        } else {
          log(`adding attendance for ${childName} with id ${get(user, '[0].id')}`);
          addNewEventAttendanceWithStatus(get(user, '[0].id'), get(user, '[0].studentProfile.id'), getEventId());
          generateCertificateScript([get(user, '[0].id')]);
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
              addNewEventAttendanceWithStatus(get(child, 'user.id'), get(child, 'id'), getEventId());
              generateCertificateScript([get(child, 'user.id')]);
            }
          }
        }
      }
    }
  }
};

const typeformWebhookController = async (req, res) => {
  const digest = getHashDigest(get(req, 'body'));
  log(`digest ${digest}`);
  if (get(req, 'headers.user-agent') === 'Typeform Webhooks' && get(req, 'body.event_type') === 'form_response') {
    const fields = get(req, 'body.form_response.definition.fields', []);
    let studentDetailsObject = {};
    const answers = get(req, 'body.form_response.answers', []);
    // eslint-disable-next-line no-restricted-syntax
    for (const field of fields) {
      const { title, ref, type } = field;
      const studentAnswer = answers.find((answer) => get(answer, 'field.ref') === ref);
      if (title === 'Student Name') studentDetailsObject.childName = get(studentAnswer, 'text');
      if (title === 'Parent Name') studentDetailsObject.parentName = get(studentAnswer, 'text');
      if (title === 'Email') studentDetailsObject.parentEmail = get(studentAnswer, type);
      if (title === 'Grade/Standard') studentDetailsObject.grade = `Grade${get(studentAnswer, 'choice.label')}`;
      if (title === 'Phone Number') studentDetailsObject.parentPhone = getCountryCodeAndNumber(get(studentAnswer, type));
    }
    studentDetailsObject = {
      ...studentDetailsObject,
      country: 'india',
      timezone: 'Asia/Kolkata',
      utmSource: 'RadioStreet',
      utmCampaign: 'Spy Squad Camp - 31th Oct',
    };
    usersData(studentDetailsObject);
    res.sendStatus(200);
  } else {
    res.status(401).send('Unauthorized');
  }
};

export default typeformWebhookController;
