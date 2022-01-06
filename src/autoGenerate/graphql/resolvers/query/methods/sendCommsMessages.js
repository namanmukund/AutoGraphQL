import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../../services/email/utils/sendEmail';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';

const fetchComms = async () => {
  const query = `{
    commsVariables(filter: {dataField_in: [parentName,studentName,parentEmail,speakerName,eventDate,eventName]}){
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
  const commsVariables = await fetchComms();
  const { mail } = params;
  if (mail === false) {
    const {
      templateName,
      studentName,
      parentName,
      studentGrade,
      eventDate,
      eventName,
      speakerName,
      parentEmail,
      parentPhone,
    } = params;
    const mapCommsWithDataFields = new Map();
    // eslint-disable-next-line array-callback-return
    commsVariables.map((obj) => {
      if (obj.whatsappVariableName !== NULL) {
        mapCommsWithDataFields.set(obj.dataField, obj.whatsappVariableName);
      }
    });
    const parameters = [];
    if (studentName && mapCommsWithDataFields.get('studentName') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('studentName'),
        value: studentName,
      };
      parameters.push(tempObj);
    }
    if (parentName && mapCommsWithDataFields.get('parentName') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('parentName'),
        value: parentName,
      };
      parameters.push(tempObj);
    }
    if (studentGrade && mapCommsWithDataFields.get('studentGrade') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('studentGrade'),
        value: studentGrade,
      };
      parameters.push(tempObj);
    }
    if (eventDate && mapCommsWithDataFields.get('eventDate') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('eventDate'),
        value: eventDate,
      };
      parameters.push(tempObj);
    }
    if (eventName && mapCommsWithDataFields.get('eventName') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('eventName'),
        value: eventName,
      };
      parameters.push(tempObj);
    }
    if (speakerName && mapCommsWithDataFields.get('speakerName') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('speakerName'),
        value: speakerName,
      };
      parameters.push(tempObj);
    }
    if (parentEmail && mapCommsWithDataFields.get('parentEmail') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('parentEmail'),
        value: parentEmail,
      };
      parameters.push(tempObj);
    }
    if (parentPhone && mapCommsWithDataFields.get('parentPhone') !== NULL) {
      const tempObj = {
        name: mapCommsWithDataFields.get('parentPhone'),
        value: parentPhone,
      };
      parameters.push(tempObj);
    }
    sendWhatsAppTemplateMessage(parentPhone, templateName, broadcastName, parameters);
  } else {
    // eslint-disable-next-line no-unused-vars
    const templateFileName = 'forgetUserTemplate';
    // eslint-disable-next-line no-unused-vars
    const templateObject = {
      forgotPassLink: 'abhay@gmail.com',
      appName: 'Tekie-test',
      name: 'Abhay',
    };
    // eslint-disable-next-line no-unused-vars
    const templateString = parsedHtmlFromTemplateFileAndObject(
      templateFileName, templateObject,
    );
    templateString.then((html) => {
      const ccEmail = '';
      const bccEmail = '';
      const subject = 'Reset Password';
      const text = 'This is test email';
      const emailMsgObject = getEmailObject('cotabhay@gmail.com', ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
      sendEmail(emailMsgObject);
    });
  }
  return {
    result: true,
  };
};

export default sendCommsMessage;
