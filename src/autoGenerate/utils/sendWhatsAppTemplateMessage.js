import { testMailingList } from '../../../constants';

/* eslint-disable camelcase */
const fetch = require('node-fetch');

const sendWhatsAppTemplateMessage = async (
  phoneNumber,
  template_name,
  broadcast_name,
  parameters,
) => {
  // if (!phoneNumber.startsWith('91')) return null;
  const bodyJson = {
    template_name,
    broadcast_name: broadcast_name || 'Tekie',
    parameters: JSON.stringify(parameters),
  };
  const headers = {
    Authorization: process.env.WATI_SECRET,
    'Content-Type': 'application/json',
  };
  const url = process.env.WATI_API_URL + phoneNumber;

  fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyJson) });

  // test wati for log
  if (testMailingList[process.env.NODE_ENV] && testMailingList[process.env.NODE_ENV].phone && testMailingList[process.env.NODE_ENV].phone.length) {
    testMailingList[process.env.NODE_ENV].email.phone((phone) => {
      fetch(process.env.WATI_API_URL + phone, { method: 'POST', headers, body: JSON.stringify({ ...bodyJson, broadcast_name: 'Test' }) });
    });
  }
};

export default sendWhatsAppTemplateMessage;
