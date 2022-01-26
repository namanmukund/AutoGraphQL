import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import {
  TWA,
} from '../../../../constants';

const generateEventCertificate = async (userId, eventId) => {
  const query = `
    mutation {
    generateCertificate(
        input: { userId: "${userId}", eventId: "${eventId}", isBulkGenerate: true }
    ) {
        id
        assetUrl
        tekieUrl
    }
    }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.generateCertificate');
};

const updateEventSessionPostHookMethod = async (input, params, mutationName, context) => {
  const { currentUserId, eventId, currentApp } = context;
  if (currentApp === TWA && currentUserId && eventId) {
    generateEventCertificate(currentUserId, eventId);
  }
  return input;
};

export default updateEventSessionPostHookMethod;
