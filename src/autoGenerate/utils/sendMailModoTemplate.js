/* eslint-disable no-console */
const fetch = require('node-fetch');

const sendMailModoTemplate = async (
  templateID,
  bodyJson,
) => {
  // if (process.env.NODE_ENV !== 'production') return null;
  // const bodyJson = {
  //   toEmail,
  //   senderEmail,
  //   subject,
  //   senderName,
  //   campaignName,
  //   data,
  // };
  const headers = {
    mmApiKey: process.env.MAILMODO_KEY,
    'Content-Type': 'application/json',
  };
  const url = process.env.MAIL_MODO_URL + templateID;
  console.log(bodyJson);
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyJson) });
};

export default sendMailModoTemplate;
