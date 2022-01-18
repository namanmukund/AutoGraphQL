import { get } from 'lodash';
import { weekDays } from '../../../../../../constants';

const addWeekDayForOneDayEvent = (params) => {
  const {
    input: { type, eventTimeTableRule },
  } = params;
  if (type === 'oneday' && get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const weekDayNumber = new Date(get(eventTimeTableRule, 'startDate')).getDay();
    const weekDaysObj = {};
    weekDaysObj[weekDays[weekDayNumber]] = true;
    Object.assign(params.input.eventTimeTableRule, weekDaysObj);
  }
  return params;
};

export default addWeekDayForOneDayEvent;
