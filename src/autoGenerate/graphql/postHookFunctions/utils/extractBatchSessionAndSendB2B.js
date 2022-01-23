import { get } from 'lodash';
import moment from 'moment';
import { batchType } from '../../../../../constants';
import addToSchedule from '../../../../../utils/scheduleJobs/addToSchedule';
import scheduleB2BSessionReminder from '../../../../../utils/scheduleJobs/scheduleB2BSessionReminder';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import getSelectedSlotsTime from '../../preHookFunctions/validation/utils/getSelectedSlotsTime';

const BATCH_SESSION = (batchSessionId) => `{
  batchSession(id: "${batchSessionId}") {
    batch {
      type
    }
    bookingDate
    ${new Array(24).fill('').map((_, i) => `slot${i}`).join('\n')}
  }
}`;

const extractBatchSessionAndSendB2B = async (batchSessionId) => {
  const batchSessionRes = await callLocalGraphqlApi(BATCH_SESSION(batchSessionId));
  const studentBatchType = get(batchSessionRes, 'data.batchSession.batch.type');
  if (studentBatchType !== batchType.b2b) return;
  // schedule new student reminder
  const bookingDate = get(batchSessionRes, 'data.batchSession.bookingDate');
  const slot = get(getSelectedSlotsTime(get(batchSessionRes, 'data.batchSession')), '[0]');
  const bookingDateTime = new Date(moment(bookingDate).toDate().setHours(slot, 0, 0, 0)).toISOString();
  const hoursLeftForSession = Math.abs(moment(bookingDateTime).diff(moment(), 'hours'));
  const reminderDateTime = moment(bookingDateTime).subtract(1, 'hours').toDate();
  if (hoursLeftForSession < 1) {
    // send right away
    scheduleB2BSessionReminder(batchSessionId);
    return;
  }
  addToSchedule('sendB2BReminder', reminderDateTime, {
    batchSessionId,
  });
};

export default extractBatchSessionAndSendB2B;
