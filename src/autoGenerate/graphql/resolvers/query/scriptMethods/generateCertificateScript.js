import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';

const generateCertificate = async (id) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
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

const generateCertificateScript = async (userIdArray) => {
  if (userIdArray && userIdArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userId of userIdArray) {
      // eslint-disable-next-line no-await-in-loop
      const certificateDetails = await generateCertificate(userId);
      const certificateLink = get(certificateDetails, 'tekieUrl');
      // eslint-disable-next-line no-await-in-loop
      const user = await fetchUser(userId);
      const parentPhoneNumber = get(user, 'studentProfile.parents[0].user.phone.number', '');
      const parentPhoneCode = get(user, 'studentProfile.parents[0].user.phone.countryCode', '+91');
      const parentPhone = parentPhoneCode.substring(1, parentPhoneCode.length) + parentPhoneNumber;
      const studentName = get(user, 'name', '');
      sendWhatsAppTemplateMessage(
        parentPhone,
        'radiostreet_post_event_certificate',
        parentPhone,
        [
          {
            name: 'student_name',
            value: studentName,
          },
          {
            name: 'spysquad_certificate',
            value: certificateLink,
          },
        ],
      );
    }
  }
};

export default generateCertificateScript;
