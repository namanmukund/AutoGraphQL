/* eslint-disable no-await-in-loop */
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

const addShortLink = async (link) => {
  const addQuery = `mutation {
  addShortLink(input: { link: "${link}" }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addShortLink.id');
};

const generateMagicLink = async (filterString) => {
  const magicQuery = `{
  getMagicLink(input: { studentIds: ${filterString}, linkVisitLimit: 5 }) {
    linkUri
    linkToken
    user {
      id
      studentProfile {
        id
      }
    }
  }
}`;
  const magicLinks = await callLocalGraphqlApi(magicQuery);
  return get(magicLinks, 'data.getMagicLink');
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
    const isSessionLinkExist = commsVariables.find((variables) => get(variables, 'dataField') === 'meetingLink' || get(variables, 'dataField') === 'eventCertificateLink');
    let magicLinkUrls = [];
    const filterStudentId = registeredUsers.map((registeredUser) => `"${get(registeredUser, 'id')}"`);
    if (isSessionLinkExist) {
      magicLinkUrls = await generateMagicLink(`[${filterStudentId}]`);
    }
    for (const registeredUser of registeredUsers) {
      const parent = get(registeredUser, 'parents[0].user');
      const studentProfileId = get(registeredUser, 'id');
      let meetingLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}?joinSession=true`;
      let eventCertificateLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}`;
      if (isSessionLinkExist && magicLinkUrls.length) {
        const isMagicLinkExist = magicLinkUrls.find((link) => get(link, 'user.studentProfile.id') === studentProfileId);
        if (isMagicLinkExist) {
          meetingLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${meetingLink}`;
          const newMeetingLink = await addShortLink(meetingLink);
          meetingLink = `${process.env.TEKIE_WEB_URL}/redirect/${newMeetingLink}`;
          eventCertificateLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${eventCertificateLink}`;
          const neweventCertificateLink = await addShortLink(eventCertificateLink);
          eventCertificateLink = `${process.env.TEKIE_WEB_URL}/redirect/${neweventCertificateLink}`;
        }
      }
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
        meetingLink,
        meetingPassword,
        geoLocation,
        address,
        summary,
        eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
        eventCertificateLink,
        sessionLink,
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
        commsObj.parentName,
        whatsappCommsVariablesList, {
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
        // sendEmailCommsForUpdatedEvents(parentEmail,
        //   templateName,
        //   emailCommsVariableObject,
        //   'Tekie Event Reminder');
      }
    }
  }
  if (condition === 'after') {
    if (attendanceFilter === 'allUser') {
      const isSessionLinkExist = commsVariables.find((variables) => get(variables, 'dataField') === 'meetingLink' || get(variables, 'dataField') === 'eventCertificateLink');
      let magicLinkUrls = [];
      const filterStudentId = registeredUsers.map((registeredUser) => `"${get(registeredUser, 'id')}"`);
      if (isSessionLinkExist) {
        magicLinkUrls = await generateMagicLink(`[${filterStudentId}]`);
      }
      registeredUsers.forEach(async (registeredUser) => {
        const parent = get(registeredUser, 'parents[0].user');
        const studentProfileId = get(registeredUser, 'id');
        let meetingLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}?joinSession=true`;
        let eventCertificateLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}`;
        if (isSessionLinkExist && magicLinkUrls.length) {
          const isMagicLinkExist = magicLinkUrls.find((link) => get(link, 'user.studentProfile.id') === studentProfileId);
          if (isMagicLinkExist) {
            meetingLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${meetingLink}`;
            const newMeetingLink = await addShortLink(meetingLink);
            meetingLink = `${process.env.TEKIE_WEB_URL}/redirect/${newMeetingLink}`;
            eventCertificateLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${eventCertificateLink}`;
            const neweventCertificateLink = await addShortLink(eventCertificateLink);
            eventCertificateLink = `${process.env.TEKIE_WEB_URL}/redirect/${neweventCertificateLink}`;
          }
        }
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
          meetingLink,
          meetingPassword,
          geoLocation,
          address,
          summary,
          eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
          eventCertificateLink,
          sessionLink,
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
          commsObj.parentName,
          whatsappCommsVariablesList, {
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
          // sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
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
        const isSessionLinkExist = commsVariables.find((variables) => get(variables, 'dataField') === 'meetingLink' || get(variables, 'dataField') === 'eventCertificateLink');
        let magicLinkUrls = [];
        const filterStudentId = commsReceivers.map((registeredUser) => `"${get(registeredUser, 'student.id')}"`);
        if (isSessionLinkExist) {
          magicLinkUrls = await generateMagicLink(`[${filterStudentId}]`);
        }
        commsReceivers.forEach(async (receiver) => {
          const parent = get(receiver, 'student.parents[0].user');
          const studentProfileId = get(receiver, 'student.id');
          let meetingLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}?joinSession=true`;
          let eventCertificateLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}`;
          if (isSessionLinkExist && magicLinkUrls.length) {
            const isMagicLinkExist = magicLinkUrls.find((link) => get(link, 'user.studentProfile.id') === studentProfileId);
            if (isMagicLinkExist) {
              meetingLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${meetingLink}`;
              const newMeetingLink = await addShortLink(meetingLink);
              meetingLink = `${process.env.TEKIE_WEB_URL}/redirect/${newMeetingLink}`;
              eventCertificateLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${eventCertificateLink}`;
              const neweventCertificateLink = await addShortLink(eventCertificateLink);
              eventCertificateLink = `${process.env.TEKIE_WEB_URL}/redirect/${neweventCertificateLink}`;
            }
          }
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
            meetingLink,
            meetingPassword,
            geoLocation,
            address,
            summary,
            eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
            eventCertificateLink,
            sessionLink,
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
            commsObj.parentName,
            whatsappCommsVariablesList, {
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
            // sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
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
        const isSessionLinkExist = commsVariables.find((variables) => get(variables, 'dataField') === 'meetingLink' || get(variables, 'dataField') === 'eventCertificateLink');
        let magicLinkUrls = [];
        const filterStudentId = commsReceivers.map((registeredUser) => `"${get(registeredUser, 'id')}"`);
        if (isSessionLinkExist) {
          magicLinkUrls = await generateMagicLink(`[${filterStudentId}]`);
        }
        commsReceivers.forEach(async (receiver) => {
          const parent = get(receiver, 'parents[0].user');
          const studentProfileId = get(receiver, 'id');
          let meetingLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}?joinSession=true`;
          let eventCertificateLink = `${process.env.TEKIE_WEB_URL}/events/${eventId}`;
          if (isSessionLinkExist && magicLinkUrls.length) {
            const isMagicLinkExist = magicLinkUrls.find((link) => get(link, 'user.studentProfile.id') === studentProfileId);
            if (isMagicLinkExist) {
              meetingLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${meetingLink}`;
              const newMeetingLink = await addShortLink(meetingLink);
              meetingLink = `${process.env.TEKIE_WEB_URL}/redirect/${newMeetingLink}`;
              eventCertificateLink = `${get(isMagicLinkExist, 'linkUri')}&redirectTo=${eventCertificateLink}`;
              const neweventCertificateLink = await addShortLink(eventCertificateLink);
              eventCertificateLink = `${process.env.TEKIE_WEB_URL}/redirect/${neweventCertificateLink}`;
            }
          }
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
            meetingLink,
            meetingPassword,
            geoLocation,
            address,
            summary,
            eventRegistrationLink: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
            eventCertificateLink,
            sessionLink,
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
            commsObj.parentName,
            whatsappCommsVariablesList, {
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
            // sendEmailTemplateMessage(parentEmail, 'EventComplete', emailCommsVariableObject, 'Tekie Event Remainder');
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
