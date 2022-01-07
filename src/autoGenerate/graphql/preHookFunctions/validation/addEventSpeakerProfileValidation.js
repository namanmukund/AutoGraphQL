import { get } from 'lodash';
import { SpeakerIdAlreadyExist } from '../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchSpeakerProfiles = async (speakerId) => {
  const query = `
    {
        eventSpeakerProfiles(filter: user_some: { { id: "${speakerId}" } } ) {
        id
      }
    }
    `;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.eventSpeakerProfiles', []);
};

const addEventSpeakerProfileValidation = async (params) => {
  const speakerId = get(params, 'speaker');

  if (!speakerId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'SpeakerId  field is missing',
      },
    });
  }
  const speakerProfiles = await fetchSpeakerProfiles(title);
  if (speakerProfiles && speakerProfiles.length > 0) {
    throw new SpeakerIdAlreadyExist();
  }
  return true;
};

export default addEventSpeakerProfileValidation;
