/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import moment from 'moment';
import callLocalGraphqlApi from '../../../src/api/callLocalGraphqlApi';
import sendWhatsAppTemplateMessage from '../../../src/autoGenerate/utils/sendWhatsAppTemplateMessage';
import parsedHtmlFromTemplateFileAndObject from '../../../services/email/utils/parsedHtmlFromTemplateFileAndObject';
import getEmailObject from '../../../services/email/utils/getEmailObject';
import sendEmail from '../../../services/email/utils/sendEmail';

const eventQuery = (id) => `{
  event(id: "${id}") {
    id
    date
    eventName
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
const sendEmailTemplateMessage = (email, subject) => {
  const templateFileName = 'forgetUserTemplate';
  const templateObject = {
    forgotPassLink: 'random string for events comms',
    appName: 'random app name',
    name: 'random name',
  };
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
// eslint-disable-next-line consistent-return
const mapDataFieldToVariableName = (dataField) => {
  switch (dataField) {
    case 'studentName':
      return 'user.name';
    case 'parentName':
      return 'parents.user.name';
    case 'studentGrade':
      return 'grade';
    case 'parentEmail':
      return 'user.parentProfile.user.email';
    case 'parentPhone':
      return 'user.parentProfile.user.phone.number';
    default:
      break;
  }
};
const updateCommsRuleStatus = async (eventId, variable) => {
  const mutation = `mutation($input: updatedEventCommsRuleInput!) {
      updateEvent(id :"${eventId}", input: $input) {
        id
      }
  }`;
  await callLocalGraphqlApi(mutation, '', variable);
};

const sendEventComms = async () => {
  const event = await callLocalGraphqlApi(eventQuery(eventId));

  if (!get(event, 'id')) return;

  const eventsCommsRule = get(event, 'eventCommsRule');
  // eslint-disable-next-line no-restricted-syntax
  for (const rule of eventsCommsRule) {
    if (get(rule, 'isSend')) return;
    if (get(rule, 'condition') === 'before') {
      if (moment(get(event, 'date')).toNow().includes(` in ${rule.value} ${rule.unit}`)) {
        // create an array of object from eventsCommsRule array without the object whose condition is 'before'
        const newEventsCommsRule = eventsCommsRule.filter(
          (item) => item.condition !== 'before',
        );
        attendeters.forEach((attender) => {
          const commsVariableswhatsappInfoList = get(rule, 'commsVariables').map((variables) => {
            const value = get(attender, mapDataFieldToVariableName(get(variables, 'dataField')));
            return {
              name: `${variables.whatsappVariableName}`,
              value,
            };
          });
          const speakers = get(event, 'speakers', []).map((speaker) => (speaker.user.name ? speaker.user.name : null)).join(', ');
          commsVariableswhatsappInfoList.push(...[{
            name: 'event_name',
            value: get(event, 'eventName'),
          }, {
            name: 'event_date',
            value: get(event, 'date'),
          },
          {
            name: 'speaker_name',
            value: speakers,
          }]);
          // CommsVariableType
          // eslint-disable-next-line no-console
          console.log({ commsVariableswhatsappInfoList });
          const phoneNumber = get(attender, 'parents.user.phone.countryCode').split('+')[1] + get(attender, 'parents.user.phone.number');
          // sendWhatsAppTemplateMessage(
          //   918384065652,
          //   'supply_request_for_mentor_final',
          //   918384065652,
          //   [
          //     {
          //       name: 'slot_date',
          //       value: 'random_date',
          //     },
          //     {
          //       name: 'slot_time',
          //       value: 'random_time',
          //     },
          //     {
          //       name: 'tms_url',
          //       value: 'random_url',
          //     },
          //   ],
          // );
          // sendEmailTemplateMessage('keshavjhaa2678@gmail.com', 'Tekie Event Remainder');
        });
        // update the issend property of object with condition before and push the updated object in newEventsCommsRule
        newEventsCommsRule.push({
          ...rule,
          isSend: true,
        });
        // eslint-disable-next-line no-console
        console.log({ newEventsCommsRule });
        // const variable = { input: { eventCommsRule: { replace: newEventsCommsRule } } };
        // // eslint-disable-next-line no-await-in-loop
        // await updateCommsRuleStatus(eventId, variable);
      }
    }
    if (get(rule, 'condition') === 'after') {
      if (moment(get(event, 'date')).fromNow().includes(` ${rule.value} ${rule.unit} ago`)) {
        const newEventsCommsRule = eventsCommsRule.filter(
          (item) => item.condition !== 'after',
        );
        const speakers = get(event, 'speakers', []).map((speaker) => (speaker.user.name ? speaker.user.name : null)).join(', ');
        const commsVariableswhatsappInfoList = [{
          name: 'event_name',
          value: get(event, 'eventName'),
        }, {
          name: 'event_dame',
          value: get(event, 'date'),
        },
        {
          name: 'speaker_name',
          value: speakers,
        }];
        if (get(rule, 'attendanceFilter') === 'allUser') {
          const attenders = get(event, 'registeredUsers');
          attenders.forEach((attender) => {
            get(rule, 'commsVariables').forEach((variables) => {
              const value = get(attender, mapDataFieldToVariableName(get(variables, 'dataField')));
              commsVariableswhatsappInfoList.push(
                {
                  name: `${variables.whatsappVariableName}`,
                  value,
                },
              );
            });
            const phoneNumber = get(attender, 'parents.user.phone.countryCode').split('+')[1] + get(attender, 'parents.user.phone.number');
            sendWhatsAppTemplateMessage(
              phoneNumber,
              get(rule, 'templateName'),
              phoneNumber,
              commsVariableswhatsappInfoList,
            );
            sendEmailTemplateMessage(get(attender, 'parents.email'), 'Tekie Event Remainder');
          });
        } else {
          const commsReceivers = [];
          if (get(rule, 'attendanceFilter') === 'attendees') {
            const eventSessions = get(event, 'eventSessions', []);
            eventSessions.forEach((session) => get(session, 'attendence', []).forEach((attendee) => {
              if (!commsReceivers.includes(attendee)) {
                if (attendee.isPresent) {
                  commsReceivers.push(attendee);
                }
              }
            }));
          }
          if (get(rule, 'attendanceFilter') === ' nonAttendees') {
            const eventSessions = get(event, 'eventSessions', []);
            eventSessions.forEach((session) => get(session, 'attendence', []).forEach((attendee) => {
              if (!commsReceivers.includes(attendee)) {
                if (!attendee.isPresent) {
                  commsReceivers.push(attendee);
                }
              }
            }));
          }
          commsReceivers.forEach((receiver) => {
            get(rule, 'commsVariables').forEach((variables) => {
              const value = get(receiver, mapDataFieldToVariableName(get(variables, 'dataField')));
              commsVariableswhatsappInfoList.push(
                {
                  name: `${variables.whatsappVariableName}`,
                  value,
                },
              );
            });
            const phoneNumber = get(receiver, 'parents.user.phone.countryCode').split('+')[1] + get(receiver, 'parents.user.phone.number');
            sendWhatsAppTemplateMessage(
              phoneNumber,
              get(rule, 'templateName'),
              phoneNumber,
              commsVariableswhatsappInfoList,
            );
            sendEmailTemplateMessage(get(receiver, 'parents.email'), 'Tekie Event Remainder');
          });
        }
        newEventsCommsRule.push({
          ...rule,
          isSend: true,
        });
        const variable = { input: { eventCommsRule: { replace: newEventsCommsRule } } };
        // eslint-disable-next-line no-await-in-loop
        await updateCommsRuleStatus(eventId, variable);
        deleteJob();
      }
    }
  }
};

export default sendEventComms;
