// import { get } from 'lodash';
// import moment from 'moment';
// import addToSchedule from '../../../../utils/scheduleJobs/addToSchedule';
import getSelectedSlotsTime from '../preHookFunctions/validation/utils/getSelectedSlotsTime';

const addEventSessionPostHookMethod = async (input) => {
  const { sessionDate, id: eventSessionId, ...slots } = input;
  const slotsTime = getSelectedSlotsTime(slots);
  if (slotsTime.length) {
    // const scheduledDate = moment(sessionDate).set('hours', get(slotsTime, '[0]')).subtract(1, 'hour');
    // addToSchedule('eventSessionAttendance', scheduledDate, {
    //   eventSessionId,
    // });
  }
  return input;
};

export default addEventSessionPostHookMethod;
