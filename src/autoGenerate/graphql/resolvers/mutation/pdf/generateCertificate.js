/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-confusing-arrow */
import { get } from 'lodash';
import moment from 'moment';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import getSpySquadCampCertificateUrl from './uploadCertificates/spysquadcamp';
import getCanvaEventCertificateUrl from './uploadCertificates/canvaEvent';

const fetchUser = (userId, eventId) => `
{
  users(filter: {
    and: [
      {id: "${userId}"}
      {eventAttandances_some: {event_some:{id: "${eventId}"}}}
    ]
  }){
    id
    name
  }
}
`;

const fetchEventCertificate = (id, eventId) => `
{
  eventCertificates(filter: {
    and: [
      {user_some: {
        id: "${id}"
      }}
      ${eventId ? `{event_some: {
        id: "${eventId}"
      }}` : ''}
    ]
  }){
    id
    user{
      id
      name
    }
    assetUrl
  }
}
`;

const addEventCertificate = (userId, assetUrl) => `
  mutation {
    addEventCertificate(userConnectId:"${userId}",
      input: {
        assetUrl: "${assetUrl}"
      }){
        id
        assetUrl
      }
  }
`;

const updateEventCertificate = (eventCertificateId, url) => `
 mutation{
  updateEventCertificate(id:"${eventCertificateId}",input:{
    assetUrl:"${url}"
  }){
    id
    assetUrl
  }
}
`;

const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

const slugifyID = (ID) => ID ? ID.toString().trim().toUpperCase().replace(/\w{5}(?=.)/g, '$&-') : '';

/*
- generate spy squad camp certificate and uploads to s3
- returns s3 url (as assetUrl), tekieApp url (as tekieUrl), and EventCertificate document id
  (as id)
- script is at generateCertificateScript.js
*/
const generateCertificateMutationResolver = async (
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
  // eventId to be passed here too in input
  const { userId, regenerateCertificate, eventId } = input;
  const userRes = await callLocalGraphqlApi(fetchUser(userId, eventId));
  const users = get(userRes, 'data.users');
  // get eventCertificate based on event type
  const eventCertificatesRes = await callLocalGraphqlApi(fetchEventCertificate(userId, eventId));
  const eventCertificates = get(eventCertificatesRes, 'data.eventCertificates');
  let tekieUrl = '';
  if (!regenerateCertificate && eventCertificates && eventCertificates.length) {
    const exisitingEventCertificate = get(eventCertificates, '[0]', {});
    tekieUrl = `event-certificate/${slugifyID(get(exisitingEventCertificate, 'id'))}`;
    return {
      id: get(exisitingEventCertificate, 'id'),
      assetUrl: get(exisitingEventCertificate, 'assetUrl'),
      tekieUrl,
    };
  }
  if (users && users.length) {
    const userName = get(users, '[0].name', '');
    const formattedDate = moment(new Date().setHours(0, 0, 0, 0)).format('DD-MM-YYYY');
    let fetchedUrl = '';
    switch (eventId) {
      case 'ckvdiavp70000igujfgxh8mt6':
      case 'ckve5izxq0000ucui47b89pmf':
      case 'ckve5fm7o00090t1dd1v4dy13':
        fetchedUrl = await getSpySquadCampCertificateUrl(userId, userName, formattedDate);
        break;
      case 'ckvw6s3df000039in32ewhy89':
      case 'ckvwncjv400001sin0ppigr3s':
      case '':
        fetchedUrl = await getCanvaEventCertificateUrl(userId, userName, formattedDate);
        break;
      default:
        fetchedUrl = await getSpySquadCampCertificateUrl(userId, userName, formattedDate);
        break;
    }
    let eventCertificateCreated = null;
    if (fetchedUrl) {
      if (eventCertificates && eventCertificates.length) {
        const eventCertificateId = get(eventCertificates, '[0].id');
        const eventCertificateCreatedRes = await callLocalGraphqlApi(updateEventCertificate(eventCertificateId, fetchedUrl));
        eventCertificateCreated = get(eventCertificateCreatedRes, 'data.updateEventCertificate');
      } else {
        const eventCertificateCreatedRes = await callLocalGraphqlApi(addEventCertificate(userId, fetchedUrl));
        eventCertificateCreated = get(eventCertificateCreatedRes, 'data.addEventCertificate');
      }
    }
    tekieUrl = `event-certificate/${slugifyID(get(eventCertificateCreated, 'id'))}`;
    return {
      ...eventCertificateCreated,
      tekieUrl,
    };
  }
  // if no such user found with given phone number
  throw new DatabaseRecordNotFoundError();
};

export default generateCertificateMutationResolver;
