/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-confusing-arrow */
import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchEventSessions = async (eventId) => {
  const query = `
    {
      eventSessions(filter: {
        and:[
          {event_some: {id: "${eventId}"}}
        ]
      }){
        id
        attendance{
          status
          student{
            user{
              id
            }
          }
          isPresent
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.eventSessions', []);
};

const generateCertificate = async (id, regenerateCertificate, eventId, isBulkGenerate) => {
  const query = `
    mutation{
      generateCertificate(input:{
        userId:"${id}"
        regenerateCertificate:${regenerateCertificate ? 'true' : 'false'}
        eventId:"${eventId}"
        isBulkGenerate:${isBulkGenerate ? 'true' : 'false'}
      })
      {
        id
        assetUrl
        tekieUrl
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate', {});
};

/*
- function to generate certificates for all event attendees
*/
const generateCertificateInBulkMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  validateAuthentication(context);

  const { input } = params;
  const { eventId } = input;
  // loop through the event sessions
  const eventSessions = await fetchEventSessions(eventId);
  try {
    for (const eventSession of eventSessions) {
      // loop through event attendees (present)
      const attendance = get(eventSession, 'attendance', []);
      for (const studentAttendance of attendance) {
        if (get(studentAttendance, 'status', 'absent') === 'present') {
          await generateCertificate(get(studentAttendance, 'student.user.id', ''), null, eventId, true);
        }
      }
    }
  } catch (err) {
    return {
      result: false,
      error: err,
    };
  }
  return {
    result: true,
  };
};

export default generateCertificateInBulkMutationResolver;
