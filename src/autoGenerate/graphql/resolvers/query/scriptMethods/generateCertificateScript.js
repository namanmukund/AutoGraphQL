import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../../../autoGenerate/utils/sendWhatsAppTemplateMessage';

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
  return get(res, 'data.updateBatchSession.id');
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
      await generateCertificate(userId);
      // const user = await fetchUser(userId);
      // console.log(user)
      // const parentPhone = get(user, 'studentProfile.parents[0].user.phone.number');
      // const countryCode = get(user, 'studentProfile.parents[0].user.phone.countryCode');
      // const studentName = get(user, 'name');
      // const parentName = get(user, 'studentProfile.parents[0].user.name');
      // sendWhatsAppTemplateMessage(countryCode.replace('+', '')  + parentPhone, 'spy_squad_camp', parentName, [{
      //   name: 'parent_name',
      //   value: parentName,
      // }, {
      //   name: 'student_name',
      //   value: studentName,
      // }]);
    }
  }
};

export default generateCertificateScript;
