/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import sgMail from '@sendgrid/mail';
import fetch from 'node-fetch';
// import moment from 'moment';
import parsedHtmlFromTemplateFileAndObject from '../../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getEmailObject from '../../../../../../services/email/utils/getEmailObject';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { CommsError } from '../../../../../../constants/errors';
import { PhoneFieldRequiredError, EmailFieldRequiredError } from '../../../../../../constants/errors/input';
import sendGridApi from '../../../../../../config/sendGrid';
// import getSlotTimesInString from '../../../../../../utils/getSlotTimesInString';
// import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';

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
  // const fetchAllEvents = `{
  //   events {
  //     id
  //     eventStartTime
  //     eventEndTime
  //     eventTimeTableRule {
  //       startDate
  //       endDate
  //       ${getSlotTimesInString()}
  //     }
  //   }
  // }
  // `;
  // const events = await callLocalGraphqlApi(fetchAllEvents);
  // const updateEvent = async (id, startDate, endDate) => {
  //   const updateEventQuery = `mutation {
  //     updateEvent(id: "${id}", input: { eventStartTime: "${startDate}", eventEndTime: "${endDate}" }) {
  //       id
  //     }
  //   }
  //   `;
  //   await callLocalGraphqlApi(updateEventQuery);
  // };
  // if (events) {
  //   for (const event of get(events, 'data.events', [])) {
  //     const { eventStartTime, eventEndTime, eventTimeTableRule } = event;
  //     if (!eventStartTime && !eventEndTime && eventTimeTableRule) {
  //       const { startDate, endDate, ...slots } = eventTimeTableRule;
  //       const slotsTime = getSelectedSlotsTime(slots);
  //       if (startDate && endDate && slotsTime.length) {
  //         await updateEvent(get(event, 'id'), moment(startDate).set('hours', get(slotsTime, '[0]')).toISOString(), moment(endDate).set('hours', get(slotsTime, '[0]') + 1).toISOString())
  //       }
  //     }
  //   }
  // }
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
    const templateString = parsedHtmlFromTemplateFileAndObject(
      templateName, templateObject,
    );
    await templateString.then(async (html) => {
      const ccEmail = '';
      const bccEmail = '';
      const subject = 'Event Tekie';
      const text = '';
      const emailMsgObject = getEmailObject(parentEmail, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
      sgMail.setApiKey(sendGridApi.SENDGRID_API_KEY);
      await sgMail
        .send(emailMsgObject, (error) => {
          if (error) {
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
