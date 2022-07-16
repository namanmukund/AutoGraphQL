import { get } from 'lodash';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { sessionType } from '../../../../../../constants';
import { SlotsOccupiedError } from '../../../../../../constants/errors/db';
import checkSessionsWithStartAndEndTime from './checkSessionsWithStartAndEndTime';

const checkIfSlotCanBeOpenedValidation = (params, prevMentorSessions, timeSlotsInPrevDoc, userBatchCode = '') => {
  const { input } = params;
  const bookingDate = get(input, 'bookingDate');
  let batchCode = null;
  let batchId = null;
  let findSession = null;
  const { ...slots } = input;
  // const isToday = moment(finalBookingDate).diff(moment(new Date()), 'days') === 0;
  let slotTimeArray = getSelectedSlotsTime(slots);
  // if a slot is true from before we do not need to validate that, so will remove those slots from slotTimeArray
  if (timeSlotsInPrevDoc && timeSlotsInPrevDoc.length) {
    slotTimeArray = slotTimeArray.filter((el) => !timeSlotsInPrevDoc.includes(el));
  }
  // array to store all the occupied slots of mentor on that availability date
  const occupiedSlotsArray = [];
  // eslint-disable-next-line no-unused-vars
  let customError = '';
  //  below mmsFlag and bsflag is used to conditionally update error message
  let mmsflag = false;
  let bsflag = false;
  // flag to check if we need to bypass validation if slot closer than 2 hours and student length = 0
  // byDefault we will bypass. If mms or batchSession which doesn't satisfy above condition, set it false
  // and error will be thrown
  let bypassValidation = true;
  if (slotTimeArray.length) {
    // eslint-disable-next-line no-restricted-syntax
    for (const mentorSession of prevMentorSessions) {
      const mentorMenteeSessions = get(mentorSession, 'mentorMenteeSessions', []);
      const batchSessions = get(mentorSession, 'batchSessions', []);
      const adhocSessions = get(mentorSession, 'adhocSessions', []);
      const batchAndAdhocSessions = batchSessions.concat(adhocSessions);
      // for a batch mentorSession we will check batchSessions (and adhocSessions) and see which slots are occupied
      if ((mentorSession.sessionType === sessionType.trial || mentorSession.sessionType === sessionType.batch) && batchAndAdhocSessions.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const session of batchAndAdhocSessions) {
          if (userBatchCode !== get(session, 'batch.code', '')) {
            const occupiedSlotTimeArrayForBatch = getSelectedSlotsTime(session);
            occupiedSlotsArray.push(...occupiedSlotTimeArrayForBatch);
            // eslint-disable no-loop-func
            const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForBatch.includes(x));
            if (intersection && intersection.length) {
              // if called from mentorMenteeSession and BatchSesson, we will get a bookingDate
              if (get(session, 'batch.documentType') !== 'classroom') {
                // By pass the validation for classrooms
                bypassValidation = false;
              }
              if (!bsflag) {
                bsflag = true;
                customError += 'Batch(es) -> ';
              }
              batchCode = get(session, 'batch.code', '');
              batchId = get(session, 'batch.id', '');
              customError += `${get(session, 'batch.code', '')} `;
              findSession = session;
            }
          }
        }
        // for trial/paid mentorSession we will check mentorMenteeSessions and see which slots are occupied
      }
      if (mentorMenteeSessions.length && mentorSession.sessionType !== sessionType.batch) {
        // eslint-disable-next-line no-restricted-syntax
        for (const mentorMenteeSession of mentorMenteeSessions) {
          const menteeSession = get(mentorMenteeSession, 'menteeSession', '');
          if (userBatchCode !== get(menteeSession, 'user.studentProfile.batch.code', null)) {
            if (menteeSession) {
              const occupiedSlotTimeArrayForMMS = getSelectedSlotsTime(menteeSession);
              occupiedSlotsArray.push(...occupiedSlotTimeArrayForMMS);
              // eslint-disable no-loop-func
              const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForMMS.includes(x));
              if (intersection && intersection.length) {
                if (get(menteeSession, 'user.studentProfile.batch.documentType') !== 'classroom') {
                  // By pass the validation for classrooms
                  bypassValidation = false;
                }
                if (!mmsflag) {
                  mmsflag = true;
                  customError += 'Mentee(s) -> ';
                }
                customError += `${get(menteeSession, 'user.name', '')} `;
                if (get(menteeSession, 'user.studentProfile.batch.code', '')) {
                  customError += `(${get(menteeSession, 'user.studentProfile.batch.code', '')})`;
                  batchCode = get(menteeSession, 'user.studentProfile.batch.code');
                  batchId = get(menteeSession, 'user.studentProfile.batch.id');
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
      const slotsObj = {};
      // eslint-disable-next-line no-restricted-syntax
      for (const intersectionSlot of intersectionSlots) {
        errorMessage += ` slot${intersectionSlot}`;
        slotsObj[`slot${intersectionSlot}`] = true;
      }
      errorMessage += ' are already present and booked for ';
      errorMessage += customError;
      if (!bypassValidation) {
        const { startMinutes, endMinutes } = input;
        if (findSession && bookingDate && typeof startMinutes === 'number' && typeof endMinutes === 'number') {
          const sessionExists = checkSessionsWithStartAndEndTime(startMinutes, endMinutes, bookingDate, slots, findSession);
          if (sessionExists) {
            throw new SlotsOccupiedError({
              data: {
                message: errorMessage,
                batchInfo: {
                  slots: slotsObj,
                  bookingDate,
                  code: batchCode,
                  id: batchId,
                },
              },
            });
          }
          return true;
        }
        throw new SlotsOccupiedError({
          data: {
            message: errorMessage,
            batchInfo: {
              slots: slotsObj,
              bookingDate,
              code: batchCode,
              id: batchId,
            },
          },
        });
      }
    }
  }
  return true;
};

export default checkIfSlotCanBeOpenedValidation;
