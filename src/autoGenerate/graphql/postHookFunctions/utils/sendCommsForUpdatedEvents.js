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

const getEvent = async (eventId) => {
  const query = `
    {
        event(id:"${eventId}") {
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

const sendCommsForUpdatedEvents = async (eventId, eventUpdateReason, eventUpdateStatus) => {
  const event = await getEvent(eventId);
  const registeredUsers = get(event, 'registeredUsers', []);
  const timezone = get(event, 'timezone', '');
  const { ...slots } = get(event, 'eventTimeTableRule', {});
  const slotTimeStringArray = getSelectedSlotsStringArray(slots);
  const slotNumber = slotTimeStringArray[0].split('slot')[1];
  const startDate = get(event, 'eventTimeTableRule.startDate', '');
  const { dateObject, startTime } = getIntlDateTime(startDate, slotNumber, timezone);
  const eventStartdate = moment(dateObject).format('dddd, Do MMMM, YYYY');
  const endDate = get(event, 'eventTimeTableRule.endDate', '');
  const eventEndDate = moment(endDate).format('dddd, Do MMMM, YYYY');
  const toSendEmailComms = get(event, 'isEmailCommsEnabled');
  const eventName = get(batch, 'eventName');
  const locationType = get(batch, 'locationType');
  const meetingId = get(batch, 'meetingId');
  const meetingPassword = get(batch, 'meetingPassword');
  const sessionLink = get(batch, 'sessionLink');
  const geoLocation = get(batch, 'geoLocation');
  const address = get(batch, 'address');
  const state = get(batch, 'state');
  const city = get(batch, 'city');
  const pincode = get(eventSession, 'pincode');
  for (const registeredUser of registeredUsers) {
    const { user } = registeredUser.parents[0];
    const parentEmail = get(user, 'email');
    const parentPhone = get(user, 'phone.countryCode').split('+')[1] + (user, 'phone.number');
    const studentName = get(registeredUser, 'user.name');
    if (eventUpdateStatus === 'reschedule') {
      if (locationType === 'online') {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'Event Rescheduled',
          parentPhone,
          [
            {
              name: 'studentName',
              content: studentName,
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
              name: 'eventUpdateReason',
              content: eventUpdateReason,
            },
            {
              name: 'eventStartdate',
              content: eventStartdate,
            },
            {
              name: 'eventEndDate',
              content: eventEndDate,
            },
            {
              name: 'startTime',
              content: startTime,
            },
          ],
        );
      }
      if (locationType === 'venue') {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'Event Rescheduled',
          parentPhone,
          [
            {
              name: 'studentName',
              content: studentName,
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
              name: 'eventUpdateReason',
              content: eventUpdateReason,
            },
            {
              name: 'eventStartdate',
              content: eventStartdate,
            },
            {
              name: 'eventEndDate',
              content: eventEndDate,
            },
            {
              name: 'startTime',
              content: startTime,
            },
          ],
        );
      }
      if (toSendEmailComms) {
        if (locationType === 'online') {
          sendEmailCommsForUpdatedEvents(parentEmail,
            'eventRescheduleOnline',
            {
              eventName,
              meetingId,
              meetingPassword,
              sessionLink,
              studentName,
              eventUpdateReason,
              eventStartdate,
              eventEndDate,
              startTime,
            },
            'Tekie Event Rescheduled');
        }
        if (locationType === 'venue') {
          sendEmailCommsForUpdatedEvents(parentEmail,
            'eventRescheduleOnline',
            {
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
            },
            'Tekie Event Rescheduled');
        }
      }
    }
    if (eventUpdateStatus === 'cancelled') {
      if (locationType === 'online') {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'Event Rescheduled',
          parentPhone,
          [
            {
              name: 'studentName',
              content: studentName,
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
              name: 'eventUpdateReason',
              content: eventUpdateReason,
            },
            {
              name: 'eventStartdate',
              content: eventStartdate,
            },
            {
              name: 'eventEndDate',
              content: eventEndDate,
            },
          ],
        );
      }
      if (locationType === 'venue') {
        sendWhatsAppTemplateMessage(
          parentPhone,
          'Event Rescheduled',
          parentPhone,
          [
            {
              name: 'studentName',
              content: studentName,
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
              name: 'eventUpdateReason',
              content: eventUpdateReason,
            },
            {
              name: 'eventStartdate',
              content: eventStartdate,
            },
            {
              name: 'eventEndDate',
              content: eventEndDate,
            },
          ],
        );
      }
      if (toSendEmailComms) {
        if (locationType === 'online') {
          sendEmailCommsForUpdatedEvents(parentEmail,
            'eventCancelMailTemplate',
            {
              eventName,
              meetingId,
              studentName,
              eventUpdateReason,
              eventStartdate,
              eventEndDate,
            },
            'Tekie Event Canceled');
        }
        if (locationType === 'venue') {
          sendEmailCommsForUpdatedEvents(parentEmail,
            'eventCancelMailTemplate',
            {
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
            },
            'Tekie Event Canceled');
        }
      }
    }
  }
};

export default sendCommsForUpdatedEvents;
