import { get } from 'lodash';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { sessionType } from '../../../../../../constants';
import { SlotsOccupiedError } from '../../../../../../constants/errors/db';

const checkIfSlotCanBeDeletedValidation = (params, mentorSession) => {
  const { input } = params;
  const { ...slots } = input;

  const slotTimeArray = getSelectedSlotsTime(slots, 'falseOnly');

  // array to store all the occupied slots of mentor on that availability date
  const occupiedSlotsArray = [];
  if (slotTimeArray.length) {
    const mentorMenteeSessions = get(mentorSession, 'mentorMenteeSessions', []);
    const batchSessions = get(mentorSession, 'batchSessions', []);
    const adhocSessions = get(mentorSession, 'adhocSessions', []);
    const batchAndAdhocSessions = batchSessions.concat(adhocSessions);
    // for a batch mentorSession we will check batchSessions (and adhocSessions) and see which slots are occupied
    if ((mentorSession.sessionType === sessionType.trial || mentorSession.sessionType === sessionType.batch) && batchAndAdhocSessions.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const session of batchAndAdhocSessions) {
        const occupiedSlotTimeArrayForBatch = getSelectedSlotsTime(session);
        occupiedSlotsArray.push(...occupiedSlotTimeArrayForBatch);
      }
      // for trial/paid mentorSession we will check mentorMenteeSessions and see which slots are occupied
    } else if (mentorMenteeSessions.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const mentorMenteeSession of mentorMenteeSessions) {
        const menteeSession = get(mentorMenteeSession, 'menteeSession');
        const occupiedSlotTimeArrayForMMS = getSelectedSlotsTime(menteeSession);
        occupiedSlotsArray.push(...occupiedSlotTimeArrayForMMS);
      }
    }
    // storing only unique slots
    const uniqueOccupiedSlotsArray = occupiedSlotsArray.filter((v, i, a) => a.indexOf(v) === i);

    // if any slot passed in input is in occupied slot( derived from batchSession and MMS) throw error
    const intersectionSlots = slotTimeArray.filter((x) => uniqueOccupiedSlotsArray.includes(x));
    if (intersectionSlots && intersectionSlots.length) {
      let errorMessage = 'Sessions for slots ';
      // eslint-disable-next-line no-restricted-syntax
      for (const intersectionSlot of intersectionSlots) {
        errorMessage += ` slot${intersectionSlot}`;
      }
      errorMessage += ' are already booked';
      throw new SlotsOccupiedError({
        data: {
          message: errorMessage,
        },
      });
    }
  }
  return true;
};

export default checkIfSlotCanBeDeletedValidation;
