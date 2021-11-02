import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { MissingMandatoryInputInRequestError } from '../../../../../constants/errors/input';
import { SimilarDocumentAlreadyExistError } from '../../../../../constants/errors/db';

const getAcceptedSlotRequestByMentorLog = async (mentorId, mentorAvailabilitySlotId, action) => {
  const query = `{
  acceptedSlotRequestByMentorLogs(
    filter: {
      and: [
        { mentor_some: { id: "${mentorId}" } }
        { mentorAvailabilitySlot_some: { id: "${mentorAvailabilitySlotId}" } }
        {
          action:"${action}"
        }
      ]
    }
  ) {
    id
  }
}

`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.acceptedSlotRequestByMentorLogs', []);
};

const addAcceptedSlotRequestByMentorLogValidation = async (params) => {
  const { mentorConnectId, mentorAvailabilitySlotConnectId, input: { action } } = params;
  if (!mentorConnectId || !mentorAvailabilitySlotConnectId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'MentorId/MentorAvailabilitySlotId is missing in input',
      },
    });
  }
  const mentorLogs = await getAcceptedSlotRequestByMentorLog(mentorConnectId, mentorAvailabilitySlotConnectId, action);
  if (mentorLogs && mentorLogs.length > 0) {
    throw new SimilarDocumentAlreadyExistError();
  }
  return true;
};

export default addAcceptedSlotRequestByMentorLogValidation;
