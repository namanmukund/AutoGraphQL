import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

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

const generateCertificateScript = async (userIdArray) => {
  if (userIdArray && userIdArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const userId of userIdArray) {
      // eslint-disable-next-line no-await-in-loop
      await generateCertificate(userId);
    }
  }
};

export default generateCertificateScript;
