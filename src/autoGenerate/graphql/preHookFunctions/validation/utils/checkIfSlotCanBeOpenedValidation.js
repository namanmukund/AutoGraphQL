import { get } from 'lodash';
import moment from 'moment';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import { sessionType } from '../../../../../../constants';
import { SlotsOccupiedError } from '../../../../../../constants/errors/db';

const checkIfSlotCanBeOpenedValidation = (params, prevMentorSessions, timeSlotsInPrevDoc, userBatchCode = '') => {
  const { input } = params;
  const bookingDate = get(input, 'bookingDate');
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
      // for a batch mentorSession we will check batchSessions and see which slots are occupied
      if ((mentorSession.sessionType === sessionType.trial || mentorSession.sessionType === sessionType.batch) && batchSessions.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const batchSession of batchSessions) {
          if (userBatchCode !== get(batchSession, 'batch.code', '')) {
            const occupiedSlotTimeArrayForBatch = getSelectedSlotsTime(batchSession);
            occupiedSlotsArray.push(...occupiedSlotTimeArrayForBatch);
            // eslint-disable no-loop-func
            const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForBatch.includes(x));
            if (intersection && intersection.length) {
              // if called from mentorMenteeSession and BatchSesson, we will get a bookingDate
              if (bookingDate) {
                const date = new Date(finalBookingDate);
                const dateTime = date.setHours(
                  date.getHours() + intersection[0],
                );
                const currentDate = new Date();
                if (moment(dateTime).diff(moment(currentDate), 'hours') > 2) {
                  bypassValidation = false;
                } else if (get(batchSession, 'batch.studentsMeta.count', 0) > 0) {
                  bypassValidation = false;
                }
              } else {
                bypassValidation = false;
              }
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
          if (userBatchCode !== get(menteeSession, 'user.studentProfile.batch.code', '')) {
            if (menteeSession) {
              const occupiedSlotTimeArrayForMMS = getSelectedSlotsTime(menteeSession);
              occupiedSlotsArray.push(...occupiedSlotTimeArrayForMMS);
              // eslint-disable no-loop-func
              const intersection = slotTimeArray.filter((x) => occupiedSlotTimeArrayForMMS.includes(x));
              if (intersection && intersection.length) {
                bypassValidation = false;
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
      if (!bypassValidation) {
        throw new SlotsOccupiedError({
          data: {
            message: errorMessage,
          },
        });
      }
    }
  }
  return true;
};

export default checkIfSlotCanBeOpenedValidation;
