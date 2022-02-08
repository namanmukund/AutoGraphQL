/* eslint-disable camelcase */
const fetch = require('node-fetch');

const sendMailModoTemplate = async (
  templateID,
  toEmail,
  senderEmail,
  subject,
  senderName,
  campaignName,
  data,
) => {
  // if (!phoneNumber.startsWith('91')) return null;
  // if (process.env.NODE_ENV !== 'production') return null;
  // eslint-disable-next-line no-param-reassign
  const bodyJson = {
    toEmail,
    senderEmail,
    subject,
    senderName,
    campaignName,
    data: JSON.stringify(data),
  };
  const headers = {
    mmApiKey: process.env.mmApiKey,
    'Content-Type': 'application/json',
  };
  const url = process.env.WATI_API_URL.concat(`/triggerTemplateEmail/${templateID}`);

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyJson) });
};

export default sendMailModoTemplate;
