import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

const getEventCertificateQuery = (code) => `
{
  eventCertificate(id:"${code}"){
    id
    assetUrl
    eventType
    eventName
    user {
      id
      name
    }
  }
}
`;

// this API will return user's course completion certificate if exists
const getEventCertificate = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { code } } = params;
  // this will be sent in output
  const result = {};

  const getEventCertificateRes = await callLocalGraphqlApi(getEventCertificateQuery(code));
  const eventId = get(getEventCertificateRes, 'data.eventCertificate.id', null);

  if (!eventId) {
    throw new DatabaseRecordNotFoundError();
  }

  result.name = get(getEventCertificateRes, 'data.eventCertificate.user.name', null);
  result.userId = get(getEventCertificateRes, 'data.eventCertificate.user.id', null);
  result.assetUrl = get(getEventCertificateRes, 'data.eventCertificate.assetUrl', null);
  result.eventName = get(getEventCertificateRes, 'data.eventCertificate.eventName', null);
  result.eventType = get(getEventCertificateRes, 'data.eventCertificate.eventType', null);

  return result;
});

export default getEventCertificate;
