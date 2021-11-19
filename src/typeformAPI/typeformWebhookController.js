import { get } from 'lodash';
import { log } from '../../utils';
import callLocalGraphqlApi from '../api/callLocalGraphqlApi';
import generateCertificateScript from '../autoGenerate/graphql/resolvers/query/scriptMethods/generateCertificateScript';
import getCountryCodeAndNumber from '../autoGenerate/graphql/validation/getCountryCodeAndNumber';
import getHashDigest from './typeform-utils/getHashDigest';

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
    case 'cUepvPND':
      // TODO : change pre-prod and prod eventIds when created
      eventId = 'ckw4unvyp0000kpinc2515c88';
      if (process.env.NODE_ENV === 'production') {
        eventId = 'ckvxsrwlb001c0usf9lxwapt4';
        if (process.env.DATA_MASKING) {
          eventId = 'ckw5wg9rj0000gtin1st0hry6';
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
      {name: "${childName}"}
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
        generateCertificateScript([get(users, '[0].id')], false, getEventId(formId));
      } else {
        log(`adding attendance for ${childName} with id ${get(users, '[0].id')}`);
        await addNewEventAttendanceWithStatus(get(users, '[0].id'), get(users, '[0].studentProfile.id'), getEventId(formId));
        generateCertificateScript([get(users, '[0].id')], false, getEventId(formId));
      }
    } else if (parentEmail) {
      filter = `{
        and: [
          {studentProfile_some: {
          parents_some: {
            user_some: {email:"${parentEmail.trim()}"}
          }
        }}
        {name: "${childName}"}
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
          generateCertificateScript([get(user, '[0].id')], false, getEventId(formId));
        } else {
          log(`adding attendance for ${childName} with id ${get(user, '[0].id')}`);
          await addNewEventAttendanceWithStatus(get(user, '[0].id'), get(user, '[0].studentProfile.id'), getEventId(formId));
          generateCertificateScript([get(user, '[0].id')], false, getEventId(formId));
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
              generateCertificateScript([get(child, 'user.id')], false, getEventId(formId));
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
    // include switch case based on event parameter form_response.form_id
    // check this form_id param from typeform admin dashboard
    const formId = get(req, 'body.form_response.form_id', '');
    let country;
    let timezone;
    let utmSource;
    let utmCampaign;
    switch (formId) {
      case 'm47rmq7f':
        country = 'india';
        timezone = 'Asia/Kolkata';
        utmSource = 'communityevent';
        utmCampaign = 'spysquadcamp_20nov';
        break;
      case 'N5rTz2zX':
        country = 'india';
        timezone = 'Asia/Kolkata';
        utmSource = 'communityevent';
        utmCampaign = 'canva_Nov14';
        break;
      case 'cUepvPND':
        country = 'india';
        timezone = 'Asia/Kolkata';
        utmSource = 'communityevent';
        utmCampaign = 'storyspree_21nov';
        break;
      default:
        country = 'india';
        timezone = 'Asia/Kolkata';
        utmSource = 'RadioStreet';
        utmCampaign = 'Spy Squad Camp - 31th Oct';
        break;
    }
    studentDetailsObject = {
      ...studentDetailsObject,
      country,
      timezone,
      utmSource,
      utmCampaign,
    };
    usersData(studentDetailsObject, formId);
    res.sendStatus(200);
  } else {
    res.status(401).send('Unauthorized');
  }
};

export default typeformWebhookController;
