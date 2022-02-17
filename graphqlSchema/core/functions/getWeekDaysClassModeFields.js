import { weekDays } from '../../../constants';

const getWeekDaysClassModeFields = (
  fieldType,
  excludeType,
) => {
  let weekDaysClassModeFields = '';
  weekDays.forEach((day) => {
    weekDaysClassModeFields += excludeType ? `${day}ClassMode\n` : `${day}ClassMode: ${fieldType} `;
  });
  return weekDaysClassModeFields;
};

export default getWeekDaysClassModeFields;
