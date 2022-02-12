import { get } from 'lodash';
import fetch from 'node-fetch';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { CommsError } from '../../../../../../constants/errors';
import { PhoneFieldRequiredError, EmailFieldRequiredError } from '../../../../../../constants/errors/input';

const fetchComms = async (dataFieldFilter) => {
  const query = `{
    commsVariables(filter: {dataField_in: [${dataFieldFilter}]}){
      id
      whatsappVariableName
      emailVariableName
      dataField
    }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.commsVariables', []);
};

const sendCommsMessage = async (root, params, context) => {
  validateAuthentication(context);
  const { input } = params;
  const {
    templateName,
    parentEmail,
    parentPhone,
    mail,
  } = input;
  let dataFieldFilter = '';
  const dataFieldLength = Object.keys(input).length;
  // eslint-disable-next-line array-callback-return
  Object.keys(input).map((i) => {
    if (i !== 'mail' && i !== 'templateName') {
      if (i === dataFieldLength - 1) {
        dataFieldFilter += i;
      } else {
        dataFieldFilter += `${i},`;
      }
    }
  });
  const commsVariables = await fetchComms(dataFieldFilter);
  const mapCommsWithDataFields = {};
  // eslint-disable-next-line array-callback-return
  commsVariables.map((obj) => {
    if (obj.whatsappVariableName !== null) {
      mapCommsWithDataFields[obj.dataField] = mail ? obj.emailVariableName : obj.whatsappVariableName;
    }
  });
  if (!mail) {
    if (!parentPhone) {
      throw new PhoneFieldRequiredError();
    }
    const parameters = [];
    Object.keys(mapCommsWithDataFields).forEach((key) => {
      if (get(params, `input.${key}`) && mapCommsWithDataFields[key]) {
        parameters.push({
          name: mapCommsWithDataFields[key],
          value: get(params, `input.${key}`),
        });
      }
    });
    const broadcastName = 'Tekie';
    let phoneNumber = parentPhone;
    if (process.env.DATA_MASKING) phoneNumber = '919999694605';
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) phoneNumber = `91${phoneNumber}`;
    const bodyJson = {
      template_name: templateName,
      broadcast_name: broadcastName || 'Tekie',
      parameters: JSON.stringify(parameters),
    };
    const headers = {
      Authorization: process.env.WATI_SECRET,
      'Content-Type': 'application/json',
    };
    const url = process.env.WATI_API_URL + phoneNumber;
    await fetch(url, {
      method: 'POST', headers, body: JSON.stringify(bodyJson),
    }).then((res) => res.json()).then((result) => {
      if (!get(result, 'result')) {
        throw new CommsError();
      }
    });
  } else {
    if (!parentEmail) {
      throw new EmailFieldRequiredError();
    }
    const templateObject = {};
    Object.keys(mapCommsWithDataFields).forEach((key) => {
      if (get(params, `input.${key}`) && mapCommsWithDataFields[key]) {
        templateObject[mapCommsWithDataFields[key]] = get(params, `input.${key}`);
      }
    });
    templateObject.student_name = 'pawan';
    const bodyJson = {
      toEmail: parentEmail,
      senderEmail: 'hello@tekie.in',
      subject: 'Testing Comms',
      senderName: 'Tekie',
      campaignName: '',
      data: templateObject,
    };
    const headers = {
      mmApiKey: process.env.MAILMODO_KEY,
      'Content-Type': 'application/json',
    };
    const url = process.env.MAIL_MODO_URL + templateName;

    await fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyJson) }).then((res) => {
      res.json().then((resp) => {
        if (!get(resp, 'success')) {
          throw new CommsError();
        }
      });
    });
  }
  return {
    result: true,
  };
};

export default sendCommsMessage;
