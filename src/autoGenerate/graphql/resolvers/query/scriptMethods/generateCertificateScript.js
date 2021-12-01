import { get } from 'lodash';
import updateLeadSquared from '../../../../../../services/leadsquared/updateLeadSquared';
import { log } from '../../../../../../utils';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
// import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';

const generateCertificate = async (id, regenerateCertificate, eventId, date) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        eventId:"${eventId}"
        ${date ? `date: "${date}"` : ''}
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

const fetchUser = async (id, eventId) => {
  const query = `
    query{
      users(filter:{
        and:[
          {id: "${id}"},
          {eventAttandances_some: {event_some:{id: "${eventId}"}}}
        ]
      })
      {
        id
        name
        utmCampaign
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
  return get(res, 'data.users', []);
};

// const getEventAttendances = async () => {
//   const query = `{
//   eventAttendances {
//     id
//     user {
//       id
//       name
//     }
//     attendance
//   }
// }`;
//   const result = await callLocalGraphqlApi(query);
//   return get(result, 'data.eventAttendances', []);
// };

const generateCertificateScript = async (userIdArray, regenerateCertificate = false, eventId, date) => {
  // make this dynamic based on a third paramenter eventId, use switch case
  // pass eventId param to generateCertificate
  if (userIdArray && userIdArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userId of userIdArray) {
      // eslint-disable-next-line no-await-in-loop
      const certificateDetails = await generateCertificate(userId, regenerateCertificate, eventId, date);
      const certificateLink = `${process.env.TEKIE_WEB_URL}/${get(certificateDetails, 'tekieUrl')}`;
      // eslint-disable-next-line no-await-in-loop
      const user = await fetchUser(userId, eventId);
      const parentPhoneNumber = get(user, '[0].studentProfile.parents[0].user.phone.number', '');
      log(`sending certificate ${certificateLink}`);
      updateLeadSquared({
        Phone: parentPhoneNumber,
        mx_Event_Ceritificate: certificateLink,
      }, false, {
        ActivityEvent: 210,
        Fields: [
          {
            SchemaName: 'Status',
            Value: 'Active',
          },
          {
            SchemaName: 'mx_Custom_1',
            Value: 'Present',
          },
          {
            SchemaName: 'mx_Custom_2',
            Value: 'spysquadcamp',
          },
        ],
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
