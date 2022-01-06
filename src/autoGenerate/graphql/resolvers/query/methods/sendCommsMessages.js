import { get } from 'lodash';
import parsedHtmlFromTemplateFileAndObject from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../../services/email/utils/sendEmail';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import sendWhatsAppTemplateMessage from '../../../../utils/sendWhatsAppTemplateMessage';
import { CommsError } from '../../../../../../constants/errors';

const NULL = null;

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
    studentName,
    parentName,
    studentGrade,
    eventDate,
    eventName,
    speakerName,
    parentEmail,
    parentPhone,
    mail,
  } = input;
  let dataFieldFilter = '';
  const l = Object.keys(input).length;
  // eslint-disable-next-line array-callback-return
  Object.keys(input).map((i) => {
    if (i !== 'mail' && i !== 'templateName') {
      if (i === l - 1) {
        dataFieldFilter += i;
      } else {
        dataFieldFilter += `${i},`;
      }
    }
  });
  const commsVariables = await fetchComms(dataFieldFilter);
  if (mail === false) {
    const mapCommsWithDataFields = new Map();
    // eslint-disable-next-line array-callback-return
    commsVariables.map((obj) => {
      if (obj.whatsappVariableName !== null) {
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
    const broadcastName = 'Tekie';
    try {
      sendWhatsAppTemplateMessage(parentPhone, templateName, broadcastName, parameters);
    } catch (e) {
      throw new CommsError();
    }
  } else {
    const mapCommsWithDataFields = new Map();
    // eslint-disable-next-line array-callback-return
    commsVariables.map((obj) => {
      if (obj.emailVariableName !== NULL) {
        mapCommsWithDataFields.set(obj.dataField, obj.emailVariableName);
      }
    });
    const templateObject = {};
    if (studentName && mapCommsWithDataFields.get('studentName') !== NULL) {
      templateObject[mapCommsWithDataFields.get('studentName')] = studentName;
    }
    if (parentName && mapCommsWithDataFields.get('parentName') !== NULL) {
      templateObject[mapCommsWithDataFields.get('parentName')] = parentName;
    }
    if (studentGrade && mapCommsWithDataFields.get('studentGrade') !== NULL) {
      templateObject[mapCommsWithDataFields.get('studentGrade')] = studentGrade;
    }
    if (eventDate && mapCommsWithDataFields.get('eventDate') !== NULL) {
      templateObject[mapCommsWithDataFields.get('eventDate')] = eventDate;
    }
    if (eventName && mapCommsWithDataFields.get('eventName') !== NULL) {
      templateObject[mapCommsWithDataFields.get('eventName')] = eventName;
    }
    if (speakerName && mapCommsWithDataFields.get('speakerName') !== NULL) {
      templateObject[mapCommsWithDataFields.get('speakerName')] = speakerName;
    }
    if (parentEmail && mapCommsWithDataFields.get('parentEmail') !== NULL) {
      templateObject[mapCommsWithDataFields.get('parentEmail')] = parentEmail;
    }
    if (parentPhone && mapCommsWithDataFields.get('parentPhone') !== NULL) {
      templateObject[mapCommsWithDataFields.get('parentPhone')] = parentPhone;
    }
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
