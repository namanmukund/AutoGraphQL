import { get } from 'lodash';
import { weekDays } from '../../../../../../constants';

const addWeekDayForOneDayEvent = (params) => {
  const type = get(params, 'input.type');
  const eventTimeTableRule = get(params, 'input.eventTimeTableRule');
  if (type && type === 'oneday' && get(eventTimeTableRule, 'startDate') && get(eventTimeTableRule, 'endDate')) {
    const weekDayNumber = new Date(get(eventTimeTableRule, 'startDate')).getDay();
    const weekDaysObj = {};
    weekDaysObj[weekDays[weekDayNumber]] = true;
    Object.assign(params.input.eventTimeTableRule, weekDaysObj);
  }
  return params;
};

export default addWeekDayForOneDayEvent;
