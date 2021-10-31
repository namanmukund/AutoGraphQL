import { get } from 'lodash';
import updateLeadSquared from '../../../../../../services/leadsquared/updateLeadSquared';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
// import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';

const generateCertificate = async (id, regenerateCertificate) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
      })
      {
        id
        assetUrl
        tekieUrl
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate', {});
};

const fetchUser = async (id) => {
  const query = `
    query{
      user(id: "${id}")
      {
        id
        name
        studentProfile{
          parents{
            user{
              id
              name
              email
              phone{
                countryCode
                number
              }
            }
          }
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user', {});
};

const getEventAttendances = async () => {
  const query = `{
  eventAttendances {
    id
    user {
      id
      name
    }
    attendance
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventAttendances', []);
};

const generateCertificateScript = async (regenerateCertificate = true) => {
  const events = await getEventAttendances();
  const userIdArray = [];
  if (events && events.length > 0) {
    events.forEach((event) => {
      if (get(event, 'user.id') && !userIdArray.includes(get(event, 'user.id'))) {
        userIdArray.push(get(event, 'user.id'));
      }
    });
  }
  if (userIdArray && userIdArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userId of userIdArray) {
      // eslint-disable-next-line no-await-in-loop
      const certificateDetails = await generateCertificate(userId, regenerateCertificate);
      const certificateLink = `${process.env.TEKIE_WEB_URL}/${get(certificateDetails, 'tekieUrl')}`;
      // eslint-disable-next-line no-await-in-loop
      const user = await fetchUser(userId);
      const parentPhoneNumber = get(user, 'studentProfile.parents[0].user.phone.number', '');
      log(`sending certificate ${certificateLink}`);
      updateLeadSquared({
        Phone: parentPhoneNumber,
        mx_Event_Ceritificate: certificateLink,
      }, false, {
        ActivityEvent: 210,
      });
      // sendWhatsAppTemplateMessage(
      //   parentPhone,
      //   'radiostreet_post_event_certificate',
      //   parentPhone,
      //   [
      //     {
      //       name: 'student_name',
      //       value: studentName,
      //     },
      //     {
      //       name: 'spysquad_certificate',
      //       value: certificateLink,
      //     },
      //   ],
      // );
    }
  }
};

export default generateCertificateScript;
