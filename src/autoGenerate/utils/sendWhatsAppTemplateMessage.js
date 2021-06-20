/* eslint-disable camelcase */
const fetch = require('node-fetch');
const { get } = require('lodash');

const USER_QUERY = (phone) => `{
  users(filter: { phone_number_subDoc: "${phone}" }) {
    id
    parentProfile {
      children {
        batch {
          type
        }
      }
    }
  }
}`;

const sendWhatsAppTemplateMessage = async (
  phoneNumber,
  countryCode,
  template_name,
  broadcast_name,
  parameters,
) => {
  if (process.env.NODE_ENV !== 'production') return null;
  const res = await callLocalGraphqlApi(USER_QUERY(phoneNumber.replace(countryCode, '')));
  const isBatchTypeB2B = get(res, 'data.users[0].parentProfile.children', []).find((child) => get(child, 'batch.type') === 'b2b');
  if (isBatchTypeB2B) return null;
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
