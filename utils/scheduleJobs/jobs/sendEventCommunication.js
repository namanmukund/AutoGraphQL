/* eslint-disable comma-dangle */
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
    name
    summary
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
    timeZone
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
        isPresent
        student {
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
  const mutation = `mutation($input: EventUpdate) {
    updateEvent(id: "${eventId}", input: $input) {
      id
    }
  }
`;
  await callLocalGraphqlApi(mutation, '', variable);
};

const sendEventCommunication = async ({
  eventId,
  commsVariables = [],
  templateName,
  isEmailRule,
  condition,
  attendanceFilter,
  value,
  unit,
}, deleteJob = () => {}) => {
  const eventData = await callLocalGraphqlApi(eventQuery(eventId));
  const event = get(eventData, 'data.event');
  const registeredUsers = get(event, 'registeredUsers', []);
  const eventCommsRules = get(event, 'eventCommsRule', []);
  const newEventsCommsRule = eventCommsRules.filter((rule) => get(rule, 'templateName') !== templateName);

  const filteredCommsRule = eventCommsRules.find(
    (rule) => (get(rule, 'templateName') === templateName
      && get(rule, 'condition') === condition
      && get(rule, 'unit') === unit
      && get(rule, 'value') === value
      && get(rule, 'attendanceFilter') === attendanceFilter)
  );

  const toSendEmailComms = get(event, 'isEmailCommsEnabled');
  const eventName = get(event, 'name');
  const timezone = get(event, 'timeZone', '');
  const { ...slots } = get(event, 'eventTimeTableRule', {});
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const startDate = get(event, 'eventTimeTableRule.startDate', '');
  const { dateObject, startTime } = getIntlDateTime(startDate, slotNumber, timezone);
  const eventStartdate = moment(dateObject).format('dddd, Do MMMM, YYYY');
  const endDate = get(event, 'eventTimeTableRule.endDate', '');
  const meetingId = get(event, 'meetingId');
  const meetingPassword = get(event, 'meetingPassword');
  const sessionLink = get(event, 'sessionLink');
  const geoLocation = get(event, 'geoLocation');
  const summary = get(event, 'summary');
  let speakerName = '';
  const address = `${get(event, 'address') || ''}, ${get(event, 'city') || ''}, ${get(event, 'state') || ''}, ${get(event, 'pincode') || ''}`;
  get(event, 'speakers', []).forEach((speaker, index) => { speakerName += `${get(speaker, 'user.name')}${index === get(event, 'speakers', []).length - 1 ? '' : ','}`; });
  if (condition === 'before') {
    for (const registeredUser of registeredUsers) {
      const parent = get(registeredUser, 'parents[0].user');
      const commsObj = {
        studentName: get(registeredUser, 'user.name'),
        parentName: get(parent, 'name'),
        studentGrade: get(registeredUser, 'grade'),
        parentEmail: get(parent, 'email'),
        parentPhone: `${get(parent, 'phone.countryCode')}${get(parent, 'phone.number')}`,
        eventDate: eventStartdate,
        eventName,
        speakerName,
        eventTime: startTime,
        meetingId,
        meetingLink: sessionLink,
        meetingPassword,
        geoLocation,
        address,
        summary,
        eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
        eventCertificateLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`
      };
      const whatsappCommsVariablesList = commsVariables.map((commsVariable) => (
        {
          name: get(commsVariable, 'whatsappVariableName'),
          value: commsObj[get(commsVariable, 'dataField')],
        }
      ));
      const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
        acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
        return acc;
      });
      const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
      sendWhatsAppTemplateMessage(
        newPhoneNumber,
        templateName,
        newPhoneNumber,
        whatsappCommsVariablesList,
      );
      if (toSendEmailComms) {
        sendEmailCommsForUpdatedEvents(parentEmail,
          templateName,
          emailCommsVariableObject,
          'Tekie Event Reminder');
      }
    }
  }
  if (condition === 'after') {
    if (attendanceFilter === 'allUser') {
      registeredUsers.forEach((registeredUser) => {
        const parent = get(registeredUser, 'parents[0].user');
        const commsObj = {
          studentName: get(registeredUser, 'user.name'),
          parentName: get(parent, 'name'),
          studentGrade: get(registeredUser, 'grade'),
          parentEmail: get(parent, 'email'),
          parentPhone: `${get(parent, 'phone.countryCode')}${get(parent, 'phone.number')}`,
          eventDate: eventStartdate,
          eventName,
          speakerName,
          eventTime: startTime,
          meetingId,
          meetingLink: sessionLink,
          meetingPassword,
          geoLocation,
          address,
          summary,
          eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
          eventCertificateLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}?certificate=true`
        };
        const whatsappCommsVariablesList = commsVariables.map((commsVariable) => (
          {
            name: get(commsVariable, 'whatsappVariableName'),
            value: commsObj[get(commsVariable, 'dataField')],
          }
        ));
        const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
          acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
          return acc;
        });
        const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
        sendWhatsAppTemplateMessage(
          newPhoneNumber,
          templateName,
          newPhoneNumber,
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
          if (!commsReceiversIds.includes(get(registeredUser, 'student.user.id'))) {
            if (get(registeredUser, 'isPresent')) {
              commsReceivers.push(registeredUser);
              commsReceiversIds.push(get(registeredUser, 'student.user.id'));
            }
          }
        }));
      }
      if (attendanceFilter === ' nonAttendees') {
        const eventSessions = get(event, 'eventSessions', []);
        eventSessions.forEach((session) => get(session, 'attendance', []).forEach((registeredUser) => {
          if (!commsReceivers.includes(get(registeredUser, 'student.user.id'))) {
            if (!get(registeredUser, 'isPresent')) {
              commsReceivers.push(registeredUser);
              commsReceiversIds.push(get(registeredUser, 'student.user.id'));
            }
          }
        }));
      }
      commsReceivers.forEach((receiver) => {
        const parent = get(receiver, 'student.parents[0].user');
        const commsObj = {
          studentName: get(receiver, 'student.user.name'),
          parentName: get(parent, 'name'),
          studentGrade: get(receiver, 'student.grade'),
          parentEmail: get(parent, 'email'),
          parentPhone: `${get(parent, 'phone.countryCode')}${get(parent, 'phone.number')}`,
          eventDate: eventStartdate,
          eventName,
          speakerName,
          eventTime: startTime,
          meetingId,
          meetingLink: sessionLink,
          meetingPassword,
          geoLocation,
          address,
          summary,
          eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
          eventCertificateLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}?certificate=true`
        };
        const whatsappCommsVariablesList = commsVariables.map((commsVariable) => (
          {
            name: get(commsVariable, 'whatsappVariableName'),
            value: commsObj[get(commsVariable, 'dataField')],
          }
        ));
        const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
          acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
          return acc;
        });
        const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
        sendWhatsAppTemplateMessage(
          newPhoneNumber,
          templateName,
          newPhoneNumber,
          whatsappCommsVariablesList,
        );
        if (toSendEmailComms) {
          sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
        }
      });
    }
  }
  newEventsCommsRule.push({
    ...filteredCommsRule,
    isSend: true,
  });
  const variable = { input: { eventCommsRule: { replace: newEventsCommsRule } } };
  // eslint-disable-next-line no-await-in-loop
  await updateCommsRuleStatus(eventId, variable);
  deleteJob();
};

export default sendEventCommunication;
