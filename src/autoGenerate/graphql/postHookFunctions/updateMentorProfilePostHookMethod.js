/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import closeMentorMenteeAndBatchSessionsForInactiveMentor from './utils/closeMentorMenteeAndBatchSessions';
import closeSessionsForInactiveMentor from './utils/closeSessionsForInactiveMentor';

const updateMentorProfilePostHookMethod = async (input, params) => {
  if (get(params, 'input.isMentorActive') !== undefined && get(params, 'input.isMentorActive') === false) {
    closeSessionsForInactiveMentor(input);
    closeMentorMenteeAndBatchSessionsForInactiveMentor(input);
  }
};

export default updateMentorProfilePostHookMethod;
