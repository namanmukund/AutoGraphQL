/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import getSelectedSlotsStringArray from '../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getIntlDateTime from '../timeZoneDiff';
import getSlotTimesInString from '../getSlotTimesInString';
import callSendWhatsappTemplateInQueue from './jobs/callSendWhatsappTemplateInQueue';

const getEventSessions = async () => {
  const dt = new Date().setHours(0, 0, 0, 0);
  const todayParsedDate = new Date(dt).toISOString();
  const hourValue = new Date().getHours();
  const slotNo = (hourValue + 1) <= 23 ? hourValue + 1 : 0;
  const tomorrow = new Date(dt);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowParsedDate = tomorrow.toISOString();
  const query = `
   query{
    eventSessions(
        filter:{and:[
            {sessionDate: "${slotNo === 0 ? tomorrowParsedDate : todayParsedDate}"},
            {slot${slotNo}:true},
            { event_some: { status: published } }
        ]}
    ) {
      id
      ${getSlotTimesInString()}
      sessionDate
      event {
        id
        eventSessions(orderBy: sessionDate_ASC, first: 1) {
          id
          sessionDate
        }
        isEmailCommsEnabled
        name
        locationType
        geoLocation
        address
        state
        city
        pincode
        sessionLink
        meetingId
        meetingPassword
        timeZone
        registeredUsers {
          id
          grade
          user {
            id
            name
          }
          parents {
            user {
              id
              email
              phone {
                number
                countryCode
              }
            }
          }
        }
      }
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.eventSessions', []);
};

const sendEventSessionRemainderMail = (email, sendEmailObject) => {
  const templateFileName = 'B2BAbsent';
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
  );
  const emailTo = [email];
  templateString.then((html) => {
    const ccEmail = '';
    const bccEmail = '';
    const subject = 'Tekie - event Session Reminder!';
    const text = '';
    const emailMsgObject = getEmailObject(emailTo, ccEmail, bccEmail, subject, text, html, 'hello@tekie.in');
    sendEmail(emailMsgObject);
  });
};

const addToCommsSendLogs = async ({
  templateName, triggeredAt, studentProfileId, eventId,
}) => {
  const addQuery = `mutation {
    addCommsSendLog(
      input: { templateName: "${templateName}", triggeredAt: "${new Date(triggeredAt).toISOString()}" }
      studentProfileConnectId: "${studentProfileId}"
      eventConnectId: "${eventId}"
    ) {
      id
    }
  }
  `;
  const result = await callLocalGraphqlApi(addQuery);
  return get(result, 'data.addCommsSendLog', null);
};

const scheduleEventSessionRemainder = async () => {
  const eventSessionsData = await getEventSessions();
  for (const eventSession of eventSessionsData) {
    const {
      id: eventSessionId,
      sessionDate, event: {
        id: eventId,
        timeZone, isEmailCommsEnabled, name: eventName,
        meetingId, meetingPassword, sessionLink, locationType, geoLocation,
        address, state, city, pincode, registeredUsers = [],
        eventSessions = [],
      }, ...slots
    } = eventSession;
    if (get(eventSessions, '[0].id') === eventSessionId) {
      const slotTimeStringArray = getSelectedSlotsStringArray(slots);
      const slotNumber = slotTimeStringArray[0].split('slot')[1];
      const { dateObject, startTime } = getIntlDateTime(sessionDate, slotNumber, timeZone);
      const date = moment(dateObject).format('dddd, Do MMMM, YYYY');
      registeredUsers.forEach((registeredUser) => {
        const studentName = get(registeredUser, 'user.name');
        const studentProfileId = get(registeredUser, 'id');
        const studentGrade = get(registeredUser, 'grade');
        const parents = get(registeredUser, 'parents[0].user');
        const parentEmail = get(parents, 'email');
        const parentPhone = get(parents, 'phone.countryCode').split('+')[1] + get(parents, 'phone.number');
        let parameters = [];
        if (locationType === 'online') {
          parameters = [
            {
              name: 'student_name',
              value: studentName,
            },
            {
              name: 'event_name',
              value: eventName,
            },
            {
              name: 'event_session_link',
              value: `${process.env.TEKIE_WEB_URL}/events/${eventId}`,
            },
            {
              name: 'event_time',
              value: startTime,
            },
          ];
        }
        if (locationType === 'venue') {
          parameters = [
            {
              name: 'studentName',
              value: studentName,
            },
            {
              name: 'studentGrade',
              value: studentGrade,
            },
            {
              name: 'eventName',
              value: eventName,
            },
            {
              name: 'geoLocation',
              value: geoLocation,
            },
            {
              name: 'address',
              value: address,
            },
            {
              name: 'state',
              value: state,
            },
            {
              name: 'city',
              value: city,
            },
            {
              name: 'pincode',
              value: pincode,
            },
            {
              name: 'sessionDate',
              value: date,
            },
            {
              name: 'sessionTime',
              value: startTime,
            },
          ];
        }
        if (get(parents, 'phone.number')) {
          callSendWhatsappTemplateInQueue(parentPhone,
            'event_reminder_t_1_hour',
            parentPhone,
            parameters);
          addToCommsSendLogs({
            templateName: 'event_reminder_t_1_hour',
            triggeredAt: new Date(),
            eventId,
            studentProfileId,
          });
        }
        if (isEmailCommsEnabled) {
          let emailCommsObj = {};
          if (locationType === 'online') {
            emailCommsObj = {
              eventName,
              meetingId,
              meetingPassword,
              date,
              sessionLink,
              studentName,
              startTime,
            };
          }
          if (locationType === 'venue') {
            emailCommsObj = {
              eventName,
              studentName,
              geoLocation,
              address,
              state,
              city,
              pincode,
              timeZone,
              date,
              startTime,
            };
          }
          if (parentEmail) {
            sendEventSessionRemainderMail(parentEmail, emailCommsObj);
          }
        }
      });
    }
  }
};

export default scheduleEventSessionRemainder;
