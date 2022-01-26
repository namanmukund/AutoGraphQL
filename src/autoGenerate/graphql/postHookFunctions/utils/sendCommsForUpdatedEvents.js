/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../utils/sendWhatsAppTemplateMessage';
import parsedHtmlFromTemplateFileAndObject from '../../../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../../../services/email/utils/getEmailObject';
import sendEmail from '../../../../../services/email/utils/sendEmail';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import getSelectedSlotsStringArray from './getSelectedSlotsStringArray';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';

const getEvent = async (eventId) => {
  const query = `
    {
        event(id:"${eventId}") {
            eventName
            name
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
                user {
                    name
                  }
              parents{
                user {
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
    `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.event');
};

const sendEmailCommsForUpdatedEvents = (email, templateFileName, sendEmailObject, subject) => {
  const templateString = parsedHtmlFromTemplateFileAndObject(
    templateFileName, sendEmailObject,
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

const deleteJobQuery = (id) => `
  mutation {
    deleteScheduleJob(id: "${id}") {
      id
    }
  }
`;

const deleteJobsForCancelledEvents = async (eventId) => {
  const query = `
  {
    scheduleJobs(filter: { and: [{ eventId: "${eventId}" }, { condition_not: afterRegistration }] }) {
      id
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  const scheduleJobs = get(res, 'data.scheduleJobs');
  scheduleJobs.forEach(async (job) => {
    await callLocalGraphqlApi(deleteJobQuery(get(job, 'id')));
  });
};
const sendCommsForUpdatedEvents = async (eventId, eventUpdateReason, eventUpdateStatus) => {
  const event = await getEvent(eventId);
  const {
    registeredUsers = [], timeZone, eventTimeTableRule, name: eventName,
    locationType, meetingId, meetingPassword, sessionLink, geoLocation,
    address, state, city, pincode,
  } = event;
  const {
    startDate, endDate, isEmailCommsEnabled, ...slots
  } = eventTimeTableRule;
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const { dateObject, startTime } = getIntlDateTime(startDate, slotNumber, timeZone);
  const eventStartdate = moment(dateObject).format('dddd, Do MMMM, YYYY');
  const eventEndDate = moment(endDate).format('dddd, Do MMMM, YYYY');
  for (const registeredUser of registeredUsers) {
    const user = get(registeredUser, 'parents[0].user');
    const parentEmail = get(user, 'email');
    const parentPhone = get(user, 'phone.countryCode').split('+')[1] + (user, 'phone.number');
    const studentName = get(registeredUser, 'user.name');
    if (eventUpdateStatus === 'rescheduled') {
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
            name: 'sessionLink',
            value: sessionLink,
          },
          {
            name: 'event_date',
            value: eventStartdate,
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
            name: 'eventUpdateReason',
            value: eventUpdateReason,
          },
          {
            name: 'eventStartdate',
            value: eventStartdate,
          },
          {
            name: 'eventEndDate',
            value: eventEndDate,
          },
          {
            name: 'startTime',
            value: startTime,
          },
        ];
      }
      sendWhatsAppTemplateMessage(
        parentPhone,
        'event_rescheduled_information',
        parentPhone,
        parameters,
      );
      if (isEmailCommsEnabled) {
        let sendEmailObj = {};
        if (locationType === 'online') {
          sendEmailObj = {
            eventName,
            meetingId,
            meetingPassword,
            sessionLink,
            studentName,
            eventUpdateReason,
            eventStartdate,
            eventEndDate,
            startTime,
          };
        }
        if (locationType === 'venue') {
          sendEmailObj = {
            eventName,
            studentName,
            geoLocation,
            address,
            state,
            city,
            pincode,
            timeZone,
            eventUpdateReason,
            eventStartdate,
            eventEndDate,
            startTime,
          };
        }
        sendEmailCommsForUpdatedEvents(parentEmail,
          'eventRescheduleOnline',
          sendEmailObj,
          'Tekie Event Rescheduled');
      }
    }
    if (eventUpdateStatus === 'canceled') {
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
            name: 'event_date',
            value: eventStartdate,
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
            name: 'student_name',
            value: studentName,
          },
          {
            name: 'event_name',
            value: eventName,
          },
          {
            name: 'event_date',
            value: eventStartdate,
          },
          {
            name: 'event_time',
            value: startTime,
          },
        ];
      }
      sendWhatsAppTemplateMessage(
        parentPhone,
        'event_cancellation_information',
        parentPhone,
        parameters,
      );
      if (isEmailCommsEnabled) {
        let sendEmailObj = {};
        if (locationType === 'online') {
          sendEmailObj = {
            eventName,
            meetingId,
            studentName,
            eventUpdateReason,
            eventStartdate,
            eventEndDate,
          };
        }
        if (locationType === 'venue') {
          sendEmailObj = {
            eventName,
            studentName,
            geoLocation,
            address,
            state,
            city,
            pincode,
            timeZone,
            eventUpdateReason,
            eventStartdate,
            eventEndDate,
          };
        }
        sendEmailCommsForUpdatedEvents(parentEmail,
          'eventCancelMailTemplate',
          sendEmailObj,
          'Tekie Event Canceled');
      }
      deleteJobsForCancelledEvents(eventId);
    }
  }
};

export default sendCommsForUpdatedEvents;
