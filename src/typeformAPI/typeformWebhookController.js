import { get } from 'lodash';
import { log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import generateCertificateScript from '../autoGenerate/graphql/resolvers/query/scriptMethods/generateCertificateScript';
import getCountryCodeAndNumber from '../autoGenerate/graphql/validation/getCountryCodeAndNumber';
import getHashDigest from './typeform-utils/getHashDigest';

const EVENT_ID = 'ckvdiavp70000igujfgxh8mt6';

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

const usersData = async (studentDetailsObject) => {
  let filter = '';
  const {
    childName, parentName, parentEmail, grade, parentPhone: { number },
  } = studentDetailsObject;
  if (parentEmail && number) {
    // if the student with same parent is filling form, so we also check of the childName
    filter = `{
      and:[
        {studentProfile_some: {
        parents_some: {
          user_some: { and: [
            { phone_number_subDoc: "${number}" },
            { email: "${parentEmail}" },
            ] }
        }
      }}
      { name: "${childName}" }
      ]
    }`;
  } else {
    filter = `{and: [
        {
          studentProfile_some: {
            and: [
              { parents_some: { user_some: { name: "${parentName}" } } }
              { grade: ${grade} }
            ]
          }
        }
        { name: "${childName}" }
      ]}`;
  }
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
  const users = get(await callLocalGraphqlApi(query), 'data.users', []);
  if (users && users.length) {
    const eventAttendances = await getEventAttendances(get(users, '[0].id'), EVENT_ID);
    if (eventAttendances && eventAttendances.length) {
      log(`updating attendance for ${childName} with id ${get(users, '[0].id')}`);
      updateEventAttendanceStatus(get(eventAttendances, '[0].id'));
      generateCertificateScript([get(users, '[0].id')]);
    } else {
      log(`adding attendance for ${childName} with id ${get(users, '[0].id')}`);
      addNewEventAttendanceWithStatus(get(users, '[0].id'), get(users, '[0].studentProfile.id'), EVENT_ID);
      generateCertificateScript([get(users, '[0].id')]);
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
          addNewEventAttendanceWithStatus(get(child, 'user.id'), get(child, 'id'), EVENT_ID);
          generateCertificateScript([get(child, 'user.id')]);
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
