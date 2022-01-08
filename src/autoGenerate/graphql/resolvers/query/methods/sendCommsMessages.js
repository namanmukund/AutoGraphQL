import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../../services/email/utils/sendEmail';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';
import { CommsError } from '../../../../../../constants/errors';

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
  if (mail === false) {
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
    try {
      sendWhatsAppTemplateMessage(parentPhone, templateName, broadcastName, parameters);
    } catch (e) {
      throw new CommsError();
    }
  } else {
    const templateObject = {};
    Object.keys(mapCommsWithDataFields).forEach((key) => {
      if (get(params, `input.${key}`) && mapCommsWithDataFields[key]) {
        templateObject[mapCommsWithDataFields[key]] = get(params, `input.${key}`);
      }
    });
    const templateString = parsedHtmlFromTemplateFileAndObject(
      templateName, templateObject,
    );
    templateString.then((html) => {
      const ccEmail = '';
      const bccEmail = '';
      const subject = 'Event Tekie';
      const text = '';
      const emailMsgObject = getEmailObject(parentEmail, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
      try {
        sendEmail(emailMsgObject);
      } catch (e) {
        throw new CommsError();
      }
    });
  }
  return {
    result: true,
  };
};

export default sendCommsMessage;
