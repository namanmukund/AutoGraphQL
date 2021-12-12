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
import getStoryspreeCertificateUrl from './uploadCertificates/storyspree';
import getDemoCompletionCertificateUrl from './uploadCertificates/demoCompletion';
import getGenZEventCertificateUrl from './uploadCertificates/genzenvironment';
import getIqaReportSnapshotUrl from './uploadCertificates/iqaReport';
import getCrackTheCodeCertificateUrl from './uploadCertificates/crackTheCode';

const fetchUser = (userId, eventId) => `
{
  users(filter: {
    and: [
      {id: "${userId}"}
      ${eventId ? `{eventAttandances_some: {event_some:{id: "${eventId}"}}}` : ''}
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

const addEventCertificate = (userId, assetUrl, eventType, eventName) => `
  mutation {
    addEventCertificate(userConnectId:"${userId}",
      input: {
        assetUrl: "${assetUrl}"
        eventType: ${eventType}
        eventName: ${eventName}
      }){
        id
        assetUrl
      }
  }
`;

const updateEventCertificate = (eventCertificateId, url, eventType, eventName) => `
 mutation{
  updateEventCertificate(id:"${eventCertificateId}",input:{
    assetUrl:"${url}"
    eventType: ${eventType}
    eventName: ${eventName}
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
  const {
    userId, regenerateCertificate, eventId, date, isEventCertificate,
  } = input;
  let userRes;
  if (!isEventCertificate) {
    userRes = await callLocalGraphqlApi(fetchUser(userId));
  } else {
    userRes = await callLocalGraphqlApi(fetchUser(userId, eventId));
  }
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
    let formattedDate = moment(new Date().setHours(0, 0, 0, 0)).format('DD-MM-YYYY');
    if (date) {
      formattedDate = moment(new Date(date).setHours(0, 0, 0, 0)).format('DD-MM-YYYY');
    }
    let fetchedUrl = '';
    let eventType = '';
    let eventName = '';
    // the three ids here are the event.ids created in three environments (local, pre-prod, prod)
    switch (eventId) {
      case 'ckvdiavp70000igujfgxh8mt6':
      case 'ckve5izxq0000ucui47b89pmf':
      case 'ckve5fm7o00090t1dd1v4dy13':
        fetchedUrl = await getSpySquadCampCertificateUrl(userId, userName, formattedDate);
        eventType = 'radioStreet';
        eventName = 'spySquadCamp';
        break;
      case 'ckvw6s3df000039in32ewhy89':
      case 'ckvwncjv400001sin0ppigr3s':
      case 'ckvxsrwlb001c0usf9lxwapt4':
        fetchedUrl = await getCanvaEventCertificateUrl(userId, userName, formattedDate);
        eventType = 'communityEvent';
        eventName = 'canvaMasterclass';
        break;
      case 'ckweruavk0000sxin201114uv':
      case 'ckwerqvz10000r2in5ihxd8ly':
      case 'ckweriv6q0000mzin99jm8mm2':
        fetchedUrl = await getGenZEventCertificateUrl(userId, userName, formattedDate);
        eventType = 'communityEvent';
        eventName = 'genZEnvironment';
        break;
      case 'ckw4unvyp0000kpinc2515c88':
      case 'ckw5wg9rj0000gtin1st0hry6':
      case 'ckw6eq3f30000xgin7yrxgk2l':
        fetchedUrl = await getStoryspreeCertificateUrl(userId, userName, formattedDate);
        eventType = 'communityEvent';
        eventName = 'storyspree';
        break;
      case 'ckx3bgy7p0000n1incbzkb36i':
        fetchedUrl = await getCrackTheCodeCertificateUrl(userId, userName, formattedDate);
        eventType = 'radioStreet';
        eventName = 'crackTheCode';
        break;
      case 'ckwjgmccj0000kcin04q39xe4':
      case 'ckwjwd1cz0000o4in6br2cng6':
      case 'ckwjwf4lm0000pgin7o9bbf1m':
      case 'ckwjwiigq0000rninbsqialy2':
        fetchedUrl = await getDemoCompletionCertificateUrl(userId, userName);
        eventType = 'userAchievement';
        eventName = 'demoCompletion';
        break;
      case 'ckwjl99kq0001i6in4ir2ez4z':
      case 'ckwjwg75y0001pginazc277b9':
      case 'ckwjwitwb0001rningq5ma1ei':
        fetchedUrl = await getIqaReportSnapshotUrl(userId, userName);
        eventType = 'userAchievement';
        eventName = 'iqaReport';
        break;
      default:
        fetchedUrl = await getSpySquadCampCertificateUrl(userId, userName, formattedDate);
        eventType = 'radioStreet';
        eventName = 'spySquadCamp';
        break;
    }
    let eventCertificateCreated = null;
    if (fetchedUrl) {
      if (eventCertificates && eventCertificates.length) {
        const eventCertificateId = get(eventCertificates, '[0].id');
        const eventCertificateCreatedRes = await callLocalGraphqlApi(updateEventCertificate(eventCertificateId, fetchedUrl, eventType, eventName));
        eventCertificateCreated = get(eventCertificateCreatedRes, 'data.updateEventCertificate');
      } else {
        const eventCertificateCreatedRes = await callLocalGraphqlApi(addEventCertificate(userId, fetchedUrl, eventType, eventName));
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
