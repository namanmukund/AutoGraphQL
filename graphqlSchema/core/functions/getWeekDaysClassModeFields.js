import { weekDays } from '../../../constants';

const getWeekDaysClassModeFields = (
  fieldType,
) => {
  let weekDaysClassModeFields = '';
  weekDays.forEach((day) => {
    weekDaysClassModeFields += `${day}ClassMode: ${fieldType} `;
  });
  return weekDaysClassModeFields;
};

export default getWeekDaysClassModeFields;
