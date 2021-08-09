import { get } from 'lodash';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { sessionType } from '../../../../../../constants';
import { SlotsOccupiedError } from '../../../../../../constants/errors/db';
import { log } from '../../../../../../utils';

const checkIfSlotCanBeOpenedValidation = (params, prevMentorSessions, timeSlotsInPrevDoc, userBatchCode='') => {
  const { input } = params;
  const { ...slots } = input;

  console.log('userbatchcode',userBatchCode);

  let slotTimeArray = getSelectedSlotsTime(slots);
  // if a slot is true from before we do not need to validate that, so will remove those slots from slotTimeArray
  if (timeSlotsInPrevDoc && timeSlotsInPrevDoc.length) {
    slotTimeArray = slotTimeArray.filter((el) => !timeSlotsInPrevDoc.includes(el));
  }
  console.log('slotTimeArray', slotTimeArray);
  // array to store all the occupied slots of mentor on that availability date
  const occupiedSlotsArray = [];
  // eslint-disable-next-line no-unused-vars
  let customError = '';
  let mmsflag = false;
  let bsflag = false;
  if (slotTimeArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorSession of prevMentorSessions) {
      const mentorMenteeSessions = get(mentorSession, 'mentorMenteeSessions', []);
      const batchSessions = get(mentorSession, 'batchSessions', []);
      console.log('mms', mentorMenteeSessions);
      console.log('bs', batchSessions);
      console.log('mentorSession.sessionType', mentorSession.sessionType)
      // for a batch mentorSession we will check batchSessions and see which slots are occupied
      if ((mentorSession.sessionType === sessionType.trial || mentorSession.sessionType === sessionType.batch) && batchSessions.length) {
        console.log('mentorSession.sessionType', mentorSession.sessionType)
        // eslint-disable-next-line no-restricted-syntax
        for (const batchSession of batchSessions) {
          console.log('batchCode',get(batchSession, 'batch.code', ''))
          if (userBatchCode !== get(batchSession, 'batch.code', '')){
            const occupiedSlotTimeArrayForBatch = getSelectedSlotsTime(batchSession);
            occupiedSlotsArray.push(...occupiedSlotTimeArrayForBatch);
            console.log('occupiedSlotTimeArrayForBatch', occupiedSlotTimeArrayForBatch)
            // eslint-disable no-loop-func
            const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForBatch.includes(x));
            console.log('intersection', intersection)
            if (intersection && intersection.length) {
              if (!bsflag) {
                bsflag = true;
                customError += 'Batch(es) -> ';
              }
              customError += `${get(batchSession, 'batch.code', '')} `;
            }
          }
        }
      // for trial/paid mentorSession we will check mentorMenteeSessions and see which slots are occupied
      }
       if (mentorMenteeSessions.length && !sessionType.batch) {
        // eslint-disable-next-line no-restricted-syntax
        for (const mentorMenteeSession of mentorMenteeSessions) {
          
          const menteeSession = get(mentorMenteeSession, 'menteeSession', '');
          console.log('menteeSession', menteeSession)
          console.log('menteeSesssion batch code', get(menteeSession, 'user.studentProfile.batch.code', ''));
          if (userBatchCode !== get(menteeSession, 'user.studentProfile.batch.code', '')){
            if (menteeSession) {
              const occupiedSlotTimeArrayForMMS = getSelectedSlotsTime(menteeSession);
              occupiedSlotsArray.push(...occupiedSlotTimeArrayForMMS);
              console.log('occupiedSlotTimeArrayForMMS', occupiedSlotTimeArrayForMMS)
              // eslint-disable no-loop-func
              const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForMMS.includes(x));
              console.log('intersection', intersection)
              if (intersection && intersection.length) {
                if (!mmsflag) {
                  mmsflag = true;
                  customError += 'Mentee(s) -> ';
                }
                customError += `${get(menteeSession, 'user.name', '')} `;
                if (get(menteeSession, 'user.studentProfile.batch.code', '')) {
                  customError += `(${get(menteeSession, 'user.studentProfile.batch.code', '')})`;
                }
              }
            }
          }
        }
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
      errorMessage += ' are already present and booked for ';
      errorMessage += customError;
      throw new SlotsOccupiedError({
        data: {
          message: errorMessage,
        },
      });
    }
  }
  return true;
};

export default checkIfSlotCanBeOpenedValidation;
