/* eslint-disable comma-dangle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';
import getIntlDateTime from '../../timeZoneDiff';
import getSelectedSlotsStringArray from '../../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import callSendWhatsappTemplateInQueue from './callSendWhatsappTemplateInQueue';
import getSlotTimesInString from '../../getSlotTimesInString';

const getJobData = async (jobId) => {
  const query = `{
  scheduleJob(id: "${jobId}") {
    id
    }
  }
  `;
  const job = await callLocalGraphqlApi(query);
  return get(job, 'data.scheduleJob.id');
};

const addToCommsSendLogs = async ({
  templateName, triggeredAt, studentProfileId, eventId,
  condition, unit, value, attendanceFilter
}) => {
  const addQuery = `mutation {
    addCommsSendLog(
      input: {
        templateName: "${templateName}", triggeredAt: "${new Date(triggeredAt).toISOString()}" 
        ${condition ? `condition:"${condition}"` : ''}
        ${unit ? `unit:"${unit}"` : ''}
        ${value ? `value:"${value}"` : ''}
        ${attendanceFilter ? `attendanceFilter:"${attendanceFilter}"` : ''}
      }
      studentProfileConnectId: "${studentProfileId}"
      eventConnectId: "${eventId}"
    ) {
      id
    }
  }
  `;
  const result = await callLocalGraphqlApi(addQuery);
  // eslint-disable-next-line no-console
  console.log(`added comms====================${get(result, 'data.addCommsSendLog.id')}`);
  return get(result, 'data.addCommsSendLog', null);
};

const eventQuery = (id) => `{
  event(id: "${id}") {
    id
    name
    summary
    isEmailCommsEnabled
    eventTimeTableRule {
      startDate
      endDate
      ${getSlotTimesInString()}
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
  jobId,
}, deleteJob = () => { }) => {
  if (jobId) {
    const jobData = await getJobData(jobId);
    if (!jobData) return null;
  }
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
      const studentProfileId = get(registeredUser, 'id');
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
      const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
      callSendWhatsappTemplateInQueue(newPhoneNumber,
        templateName,
        newPhoneNumber,
        whatsappCommsVariablesList);
      addToCommsSendLogs({
        templateName,
        triggeredAt: new Date(),
        eventId,
        studentProfileId,
        condition,
        value,
        unit,
        attendanceFilter
      });
      if (toSendEmailComms && commsVariables.length) {
        const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
          acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
          return acc;
        });
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
        const studentProfileId = get(registeredUser, 'id');
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
        const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
        callSendWhatsappTemplateInQueue(newPhoneNumber,
          templateName,
          newPhoneNumber,
          whatsappCommsVariablesList);
        addToCommsSendLogs({
          templateName,
          triggeredAt: new Date(),
          eventId,
          studentProfileId,
          condition,
          value,
          unit,
          attendanceFilter
        });
        if (toSendEmailComms && commsVariables.length) {
          const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
            acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
            return acc;
          });
          sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
        }
      });
    } else {
      if (attendanceFilter === 'attendees') {
        const commsReceivers = [];
        const commsReceiversIds = [];
        const eventSessions = get(event, 'eventSessions', []);
        eventSessions.forEach((session) => get(session, 'attendance', []).forEach((registeredUser) => {
          if (!commsReceiversIds.includes(get(registeredUser, 'student.user.id'))) {
            if (get(registeredUser, 'isPresent')) {
              commsReceivers.push(registeredUser);
              commsReceiversIds.push(get(registeredUser, 'student.user.id'));
            }
          }
        }));
        commsReceivers.forEach((receiver) => {
          const parent = get(receiver, 'student.parents[0].user');
          const studentProfileId = get(receiver, 'student.id');
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
            eventCertificateLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`
          };
          const whatsappCommsVariablesList = commsVariables.map((commsVariable) => (
            {
              name: get(commsVariable, 'whatsappVariableName'),
              value: commsObj[get(commsVariable, 'dataField')],
            }
          ));
          const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
          callSendWhatsappTemplateInQueue(newPhoneNumber,
            templateName,
            newPhoneNumber,
            whatsappCommsVariablesList);
          addToCommsSendLogs({
            templateName,
            triggeredAt: new Date(),
            eventId,
            studentProfileId,
            condition,
            value,
            unit,
            attendanceFilter
          });
          if (toSendEmailComms && commsVariables.length) {
            const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
              acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
              return acc;
            });
            sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
          }
        });
      }
      if (attendanceFilter === 'nonAttendees') {
        const eventSessions = get(event, 'eventSessions', []);
        const commsReceiversIds = [];
        const commsReceivers = [];
        registeredUsers.forEach((registeredUser) => {
          const notAttended = eventSessions.find((session) => get(session, 'attendance', []).find((attendee) => get(registeredUser, 'id') === get(attendee, 'student.id')));
          if (!notAttended && !commsReceiversIds.includes(get(registeredUser, 'user.id'))) {
            commsReceivers.push(registeredUser);
            commsReceiversIds.push(get(registeredUser, 'user.id'));
          }
        });
        commsReceivers.forEach((receiver) => {
          const parent = get(receiver, 'parents[0].user');
          const studentProfileId = get(receiver, 'id');
          const commsObj = {
            studentName: get(receiver, 'user.name'),
            parentName: get(parent, 'name'),
            studentGrade: get(receiver, 'grade'),
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
          const newPhoneNumber = get(commsObj, 'parentPhone').replace('+', '');
          callSendWhatsappTemplateInQueue(newPhoneNumber,
            templateName,
            newPhoneNumber,
            whatsappCommsVariablesList);
          addToCommsSendLogs({
            templateName,
            triggeredAt: new Date(),
            eventId,
            studentProfileId,
            condition,
            value,
            unit,
            attendanceFilter
          });
          if (toSendEmailComms && commsVariables.length) {
            const emailCommsVariableObject = commsVariables.reduce((acc, commsVariable) => {
              acc[get(commsVariable, 'emailVariableName')] = commsObj[get(commsVariable, 'dataField')];
              return acc;
            });
            sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
          }
        });
      }
    }
  }
  if (filteredCommsRule) {
    newEventsCommsRule.push({
      ...filteredCommsRule,
      isSend: true,
    });
    const variable = { input: { eventCommsRule: { replace: newEventsCommsRule } } };
    // eslint-disable-next-line no-await-in-loop
    await updateCommsRuleStatus(eventId, variable);
  }
  deleteJob();
  return true;
};

export default sendEventCommunication;
