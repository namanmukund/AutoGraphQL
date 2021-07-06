/* eslint-disable camelcase */
const fetch = require('node-fetch');

const sendWhatsAppTemplateMessage = async (
  phoneNumber,
  template_name,
  broadcast_name,
  parameters,
) => {
  // if (!phoneNumber.startsWith('91')) return null;
  if (process.env.NODE_ENV !== 'production') return null;
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

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyJson) });
};

export default sendWhatsAppTemplateMessage;
