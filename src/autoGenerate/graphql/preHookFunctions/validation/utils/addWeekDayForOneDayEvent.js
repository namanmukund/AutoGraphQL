import { get } from 'lodash';
import moment from 'moment';
import { TIME_BEFORE_EVENT_CREATION, weekDays } from '../../../../../../constants';
import { InvalidStartTimeError } from '../../../../../../constants/errors/input';
import getSelectedSlotsTime from './getSelectedSlotsTime';
import validateBookingDate from './validateBookingDate';

const addWeekDayForOneDayEvent = (params) => {
  const type = get(params, 'input.type');
  const eventTimeTableRule = get(params, 'input.eventTimeTableRule');
  if (type && type === 'oneday' && get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const weekDayNumber = new Date(get(eventTimeTableRule, 'startDate')).getDay();
    const weekDaysObj = {};
    weekDaysObj[weekDays[weekDayNumber]] = true;
    Object.assign(params.input.eventTimeTableRule, weekDaysObj);
  }
  if (get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const { startDate, endDate, ...slots } = eventTimeTableRule;
    const slotsTime = getSelectedSlotsTime(slots);
    validateBookingDate(startDate, slotsTime, 0);
    if (slotsTime.length) {
      if (moment().add(TIME_BEFORE_EVENT_CREATION, 'hour').isAfter(moment(startDate).set('hours', get(slotsTime, '[0]')).toISOString())) {
        throw new InvalidStartTimeError();
      }
      Object.assign(params.input, {
        eventStartTime: moment(startDate).set('hours', get(slotsTime, '[0]')).toISOString(),
        eventEndTime: moment(endDate).set('hours', get(slotsTime, '[0]', 0) + 1).toISOString(),
      });
    }
  }
  return params;
};

export default addWeekDayForOneDayEvent;
