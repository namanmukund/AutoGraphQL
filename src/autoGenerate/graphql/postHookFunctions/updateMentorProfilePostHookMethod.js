/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import closeMentorMenteeAndBatchSessionsForInactiveMentor from './utils/closeMentorMenteeAndBatchSessions';

const updateMentorProfilePostHookMethod = async (input, params) => {
  if (get(params, 'input.isMentorActive') !== undefined && get(params, 'input.isMentorActive') === false) {
    closeMentorMenteeAndBatchSessionsForInactiveMentor(input);
  }
};

export default updateMentorProfilePostHookMethod;
