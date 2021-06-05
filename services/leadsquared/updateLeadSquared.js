import moment from 'moment';
import queryString from 'query-string';
import fetch from 'node-fetch';

const LEAD_CREATE_ENDPOINT = '/LeadManagement.svc/Lead.Capture?';
const LEAD_UPDATE_ENDPOINT = '/ProspectActivity.svc/CreateCustom?';
const LEAD_GET_ENDPOINT = '/LeadManagement.svc/RetrieveLeadByPhoneNumber?';

const getLeadSquaredParams = (params = {}, create = false, leadActivity) => {
  const leadSquaredParams = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const key of Object.keys(params)) {
    leadSquaredParams.push({
      Attribute: key,
      Value: params[key],
    });
  }
  leadSquaredParams.push({
    Attribute: 'SearchBy',
    Value: 'Phone',
  });
  if (create) return leadSquaredParams;
  if (!leadActivity) return leadSquaredParams;
  return {
    LeadDetails: leadSquaredParams,
    Activity: {
      ...leadActivity,
      ActivityDateTime: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    },
  };
};

const logSheet = (Status, Data, Phone, error = '-') => {
  fetch(`https://script.google.com/macros/s/AKfycbxmnOewZrOJNpbu_xALna5VJMKnM6wp66Df2F3j7tkzrmoJXpY/exec?${queryString.stringify({
    Status,
    Data,
    Phone,
    Error: error,
  })}`);
};

const updateSheet = async (leadSquaredParams = {}, create = false, leadActivity) => {
  let LEAD_ENDPOINT = '';
  return;
  if (create || !leadActivity) {
    LEAD_ENDPOINT = LEAD_CREATE_ENDPOINT;
  } else {
    LEAD_ENDPOINT = LEAD_UPDATE_ENDPOINT;
  }
  console.log(leadActivity, LEAD_ENDPOINT);
  // if (process.env.NODE_ENV === 'production') {
  console.log('Phone number find...', leadSquaredParams.Phone);
  if (!create) {
    try {
      const res = await fetch(
        process.env.LEAD_SQUARED_URL + LEAD_GET_ENDPOINT + queryString.stringify({
          accessKey: process.env.LEAD_SQUARED_ACCESS_KEY,
          secretKey: process.env.LEAD_SQUARED_SECRET_KEY,
          phone: leadSquaredParams.Phone,
        }),
      );
      const data = await res.json();
      if (data.length === 0) return;
    } catch (e) {
      console.log('Failed', e, JSON.stringify(e, null, 2));
      return;
    }
  }
  console.log('leadsquared update....');
  fetch(
    process.env.LEAD_SQUARED_URL + LEAD_ENDPOINT + queryString.stringify({
      accessKey: process.env.LEAD_SQUARED_ACCESS_KEY,
      secretKey: process.env.LEAD_SQUARED_SECRET_KEY,
    }), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getLeadSquaredParams(leadSquaredParams, create, leadActivity)),
    },
  ).then((res) => {
    console.log(JSON.stringify(getLeadSquaredParams(leadSquaredParams, create, leadActivity)));
    console.log(res.status);
    logSheet(res.status, JSON.stringify(getLeadSquaredParams(leadSquaredParams, create)), leadSquaredParams.Phone);
  }).catch((e) => {
    console.log('Failed', JSON.stringify(getLeadSquaredParams(leadSquaredParams, create, leadActivity)));
    logSheet('Failed', JSON.stringify(getLeadSquaredParams(leadSquaredParams, create)), leadSquaredParams.Phone, e);
  });
  // }
};

export default updateSheet;
