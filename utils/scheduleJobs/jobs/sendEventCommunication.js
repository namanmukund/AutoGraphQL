/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';
import getIntlDateTime from '../../timeZoneDiff';
import getSelectedSlotsStringArray from '../../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';

const eventQuery = (id) => `{
  event(id: "${id}") {
    id
    eventName
    isEmailCommsEnabled
    eventTimeTableRule {
      startDate
      endDate
      slot0
      slot1
      slot2
      slot3
      slot4
      slot5
      slot6
      slot7
      slot8
      slot9
      slot10
      slot11
      slot12
      slot13
      slot14
      slot15
      slot16
      slot17
      slot18
      slot19
      slot20
      slot21
      slot22
      slot23
    }
    locationType
    geoLocation
    address
    state
    city
    pincode
    meetingId
    meetingPassword
    sessionLink
    timezone
    registeredUsers {
      id
      grade
      parents {
        id
        user {
          id
          name
          phone {
            number
            countryCode
          }
          email
        }
      }
      user {
        id
        name
      }
    }
    speakers {
      user {
        name
      }
    }
    eventSessions {
      attendance {
        id
        grade
        parents {
          id
          user {
            id
            name
            phone {
              number
              countryCode
            }
            email
          }
        }
        user {
          id
          name
        }
        isPresent
      }
    }
    eventCommsRule {
      templateName
      commsVariables {
        whatsappVariableName
        emailVariableName
        dataField
      }
      attendanceFilter
      condition
      unit
      value
      isTested
      isPassed
      isSend
    }
  }
}`;
const sendEmailTemplateMessage = (email, templateFileName, templateObject, subject) => {
//   const templateFileName = 'forgetUserTemplate';
//   const templateObject = {
//     forgotPassLink: 'random string for events comms',
//     appName: 'random app name',
//     name: 'random name',
//   };
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, templateObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};
const updateCommsRuleStatus = async (eventId, variable) => {
  const mutation = `mutation($input: updatedEventCommsRuleInput!) {
      updateEvent(id :"${eventId}", input: $input) {
        id
      }
  }`;
  await callLocalGraphqlApi(mutation, '', variable);
};

const sendEventCommunication = async ({ eventId, eventCommsRule }, deleteJob) => {
  const event = await callLocalGraphqlApi(eventQuery(eventId));
  const registeredUsers = get(event, 'registeredUsers', []);

  const eventCommsRules = get(event, 'event.eventCommsRule', []);
  const newEventsCommsRule = eventCommsRules.filter(
    (rule) => rule.templateName !== eventCommsRule.templateName && rule.condition !== eventCommsRule.condition,
  );

  const toSendEmailComms = get(event, 'isEmailCommsEnabled');
  const eventName = get(batch, 'eventName');
  const condition = get(eventCommsRule, 'condition');
  const timezone = get(event, 'timezone', '');
  const { ...slots } = get(event, 'eventTimeTableRule', {});
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const startDate = get(event, 'eventTimeTableRule.startDate', '');
  const { dateObject, startTime } = getIntlDateTime(startDate, slotNumber, timezone);
  const eventStartdate = moment(dateObject).format('dddd, Do MMMM, YYYY');
  const endDate = get(event, 'eventTimeTableRule.endDate', '');
  const eventEndDate = moment(endDate).format('dddd, Do MMMM, YYYY');
  if (condition === 'before') {
    for (const registeredUser of registeredUsers) {
      const { user } = registeredUser.parents[0];
      const parentEmail = get(user, 'email');
      const parentPhone = get(user, 'phone.countryCode').split('+')[1] + (user, 'phone.number');
      const studentName = get(registeredUser, 'user.name');
      const locationType = get(batch, 'locationType');
      const meetingId = get(batch, 'meetingId');
      const meetingPassword = get(batch, 'meetingPassword');
      const sessionLink = get(batch, 'sessionLink');
      const geoLocation = get(batch, 'geoLocation');
      const address = get(batch, 'address');
      const state = get(batch, 'state');
      const city = get(batch, 'city');
      const pincode = get(eventSession, 'pincode');
      const whatsappCommsVariablesList = get(eventCommsRule, 'commsVariables', []).map((commsVariable) => (
        {
          name: get(commsVariable, 'whatsappVariableName'),
          value: get(commsVariable, 'dataField'),
        }
      ));
      const emailCommsVariableObject = get(eventCommsRule, 'commsVariables', []).reduce((acc, commsVariable) => {
        acc[get(commsVariable, 'emailVariableName')] = get(commsVariable, 'dataField');
        return acc;
      });
      sendWhatsAppTemplateMessage(
        parentPhone,
        'Event Reainder',
        parentPhone,
        whatsappCommsVariablesList,
      );
      if (toSendEmailComms) {
        sendEmailCommsForUpdatedEvents(parentEmail,
          'OnlineEventRemainder',
          emailCommsVariableObject,
          'Tekie Event Reminder');
      }
    }
  }
  if (condition === 'after') {
    const attendanceFilter = get(eventCommsRule, 'attendanceFilter');
    if (attendanceFilter === 'allUser') {
      registeredUsers.forEach((registeredUser) => {
        const { user } = registeredUser.parents[0];
        const parentEmail = get(user, 'email');
        const parentPhone = get(user, 'phone.countryCode').split('+')[1] + (user, 'phone.number');
        const studentName = get(registeredUser, 'user.name');
        const whatsappCommsVariablesList = get(eventCommsRule, 'commsVariables', []).map((commsVariable) => (
          {
            name: get(commsVariable, 'whatsappVariableName'),
            value: get(commsVariable, 'dataField'),
          }
        ));
        const emailCommsVariableObject = get(eventCommsRule, 'commsVariables', []).reduce((acc, commsVariable) => {
          acc[get(commsVariable, 'emailVariableName')] = get(commsVariable, 'dataField');
          return acc;
        });
        sendWhatsAppTemplateMessage(
          parentPhone,
          get(eventCommsRule, 'templateName'),
          parentPhone,
          whatsappCommsVariablesList,
        );
        if (toSendEmailComms) {
          sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
        }
      });
    } else {
      const commsReceivers = [];
      const commsReceiversIds = [];
      if (attendanceFilter === 'attendees') {
        const eventSessions = get(event, 'eventSessions', []);
        eventSessions.forEach((session) => get(session, 'attendance', []).forEach((registeredUser) => {
          if (!commsReceiversIds.includes(get(registeredUser, 'user.id'))) {
            if (get(registeredUser, 'isPresent')) {
              commsReceivers.push(registeredUser);
              commsReceiversIds.push(get(registeredUser, 'user.id'));
            }
          }
        }));
      }
      if (attendanceFilter === ' nonAttendees') {
        const eventSessions = get(event, 'eventSessions', []);
        eventSessions.forEach((session) => get(session, 'attendance', []).forEach((registeredUser) => {
          if (!commsReceivers.includes(get(registeredUser, 'user.id'))) {
            if (!get(registeredUser, 'isPresent')) {
              commsReceivers.push(registeredUser);
              commsReceiversIds.push(get(registeredUser, 'user.id'));
            }
          }
        }));
      }
      commsReceivers.forEach((receiver) => {
        const { user } = receiver.parents[0];
        const studentName = get(receiver, 'user.name');
        const parentEmail = get(user, 'email');
        const phoneNumber = get(receiver, 'parents.user.phone.countryCode').split('+')[1] + get(receiver, 'parents.user.phone.number');
        const whatsappCommsVariablesList = get(eventCommsRule, 'commsVariables', []).map((commsVariable) => (
          {
            name: get(commsVariable, 'whatsappVariableName'),
            value: get(commsVariable, 'dataField'),
          }
        ));
        const emailCommsVariableObject = get(eventCommsRule, 'commsVariables', []).reduce((acc, commsVariable) => {
          acc[get(commsVariable, 'emailVariableName')] = get(commsVariable, 'dataField');
          return acc;
        });
        sendWhatsAppTemplateMessage(
          phoneNumber,
          get(eventCommsRule, 'templateName'),
          phoneNumber,
          whatsappCommsVariablesList,
        );
        if (toSendEmailComms) {
          sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
        }
      });
    }
  }
  newEventsCommsRule.push({
    ...eventCommsRule,
    isSend: true,
  });
  const variable = { input: { eventCommsRule: { replace: newEventsCommsRule } } };
  // eslint-disable-next-line no-await-in-loop
  await updateCommsRuleStatus(eventId, variable);
  deleteJob();
};

export default sendEventCommunication;
