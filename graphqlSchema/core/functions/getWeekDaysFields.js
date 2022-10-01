import { weekDays } from '../../../constants';

const getWeekDaysFields = (
  fieldType,
  excludeType,
) => {
  let weekDaysFields = '';
  weekDays.forEach((day) => {
    weekDaysFields += excludeType ? `${day}\n` : `${day}: ${fieldType} `;
  });
  return weekDaysFields;
};

export default getWeekDaysFields;
