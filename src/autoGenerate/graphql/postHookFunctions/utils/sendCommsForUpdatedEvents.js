/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getIntlDateTime from '../../../../../utils/timeZoneDiff';
import getSelectedSlotsStringArray from './getSelectedSlotsStringArray';
import getSlotTimesInString from '../../../../../utils/getSlotTimesInString';
import callSendWhatsappTemplateInQueue from '../../../../../utils/scheduleJobs/jobs/callSendWhatsappTemplateInQueue';
import sendMailModoTemplate from '../../../utils/sendMailModoTemplate';

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
  scheduleJobs.forEach((job) => {
    callLocalGraphqlApi(deleteJobQuery(get(job, 'id')));
  });
};
const sendCommsForUpdatedEvents = async (eventId, eventUpdateReason, eventUpdateStatus, shouldSendComms = false) => {
  if (shouldSendComms) {
    const event = await getEvent(eventId);
    const {
      registeredUsers = [], timeZone, eventTimeTableRule, name: eventName,
      locationType, meetingId, meetingPassword, sessionLink, geoLocation,
      address, state, city, pincode,
      isEmailCommsEnabled,
    } = event;
    const {
      startDate, endDate, ...slots
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
        callSendWhatsappTemplateInQueue(
          parentPhone,
          'event_rescheduled_information',
          parentPhone,
          parameters,
          {
            triggeredAt: new Date(),
          },
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
          sendMailModoTemplate('6821bf9a-d3db-48d1-8e7f-5343ccefabd2', {
            toEmail: parentEmail,
            senderEmail: 'hello@tekie.in',
            subject: 'Testing Comms',
            senderName: 'Tekie',
            campaignName: '',
            data: sendEmailObj,
          });
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
        callSendWhatsappTemplateInQueue(
          parentPhone,
          'event_cancellation_information',
          parentPhone,
          parameters,
          {
            triggeredAt: new Date(),
          },
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
          sendMailModoTemplate('0fc48595-8432-486f-995c-00262de24b26', {
            toEmail: parentEmail,
            senderEmail: 'hello@tekie.in',
            subject: 'Cancel Comms Test',
            senderName: 'Tekie',
            campaignName: '',
            data: sendEmailObj,
          });
        }
      }
    }
  }
  await deleteJobsForCancelledEvents(eventId);
};

export default sendCommsForUpdatedEvents;
