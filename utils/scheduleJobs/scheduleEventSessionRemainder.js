/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../src/api/callLocalGraphqlApi';
import sendEmail from '../../services/email/utils/sendEmail';
import parsedHtmlFromTemplateFileAndObject from '../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../services/email/utils/getEmailObject';
import sendWhatsAppTemplateMessage from '../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import getSelectedSlotsStringArray from '../../src/autoGenerate/graphql/postHookFunctions/utils/getSelectedSlotsStringArray';
import getIntlDateTime from '../timeZoneDiff';
import getSlotTimesInString from '../getSlotTimesInString';

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
            {sessionDate: "${slotNo === 0 ? todayParsedDate : tomorrowParsedDate}"},
            {slot${slotNo}:true},
            { event_some: { status: published } }
        ]}
    ) {
      id
      ${getSlotTimesInString()}
      sessionDate
      event {
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

const scheduleEventSessionRemainder = async () => {
  const eventSessions = getEventSessions();
  for (const eventSession of eventSessions) {
    const {
      sessionDate, event: {
        timeZone, isEmailCommsEnabled, name: eventName,
        meetingId, meetingPassword, sessionLink, locationType, geoLocation,
        address, state, city, pincode, registeredUsers = [],
      }, ...slots
    } = eventSession;
    const slotTimeStringArray = getSelectedSlotsStringArray(slots);
    const slotNumber = slotTimeStringArray[0].split('slot')[1];
    const { dateObject, startTime } = getIntlDateTime(sessionDate, slotNumber, timeZone);
    const date = moment(dateObject).format('dddd, Do MMMM, YYYY');
    registeredUsers.forEach((registeredUser) => {
      const studentName = get(registeredUser, 'user.name');
      const studentGrade = get(registeredUser, 'grade');
      const parents = get(registeredUser, 'parents[0].user');
      const parentEmail = get(parents, 'email');
      const parentPhone = get(parents, 'phone.countryCode').split('+')[1] + get(parents, 'phone.number');
      let parameters = [];
      if (locationType === 'online') {
        parameters = [
          {
            name: 'studentName',
            content: studentName,
          },
          {
            name: 'studentGrade',
            content: studentGrade,
          },
          {
            name: 'eventName',
            content: eventName,
          },
          {
            name: 'meetingId',
            content: meetingId,
          },
          {
            name: 'meetingPassword',
            content: meetingPassword,
          },
          {
            name: 'sessionLink',
            content: sessionLink,
          },
          {
            name: 'sessionDate',
            content: date,
          },
          {
            name: 'sessionTime',
            content: startTime,
          },
        ];
      }
      if (locationType === 'venue') {
        parameters = [
          {
            name: 'studentName',
            content: studentName,
          },
          {
            name: 'studentGrade',
            content: studentGrade,
          },
          {
            name: 'eventName',
            content: eventName,
          },
          {
            name: 'geoLocation',
            content: geoLocation,
          },
          {
            name: 'address',
            content: address,
          },
          {
            name: 'state',
            content: state,
          },
          {
            name: 'city',
            content: city,
          },
          {
            name: 'pincode',
            content: pincode,
          },
          {
            name: 'sessionDate',
            content: date,
          },
          {
            name: 'sessionTime',
            content: startTime,
          },
        ];
      }
      if (get(parents, 'phone.number')) {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'Event session remainder',
          parentPhone,
          parameters,
        );
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
};

export default scheduleEventSessionRemainder;
