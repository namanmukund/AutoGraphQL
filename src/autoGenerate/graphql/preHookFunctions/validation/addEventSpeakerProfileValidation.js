import { get } from 'lodash';
import { SpeakerIdAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSpeakerProfiles = async (userConnectId) => {
  const query = `
    {
        eventSpeakerProfiles(filter: { user_some:{id: "${userConnectId}" }} ) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventSpeakerProfiles', []);
};

const addEventSpeakerProfileValidation = async (params) => {
  const userConnectId = get(params, 'userConnectId');

  if (!speakerId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'userConnectId  field is missing',
      },
    });
  }
  const speakerProfiles = await fetchSpeakerProfiles(userConnectId);
  if (speakerProfiles && speakerProfiles.length > 0) {
    throw new SpeakerIdAlreadyExist();
  }
  return true;
};

export default addEventSpeakerProfileValidation;
