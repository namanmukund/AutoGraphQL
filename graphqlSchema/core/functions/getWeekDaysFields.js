import { weekDays } from '../../../constants';

const getWeekDaysFields = (
  fieldType,
) => {
  let weekDaysFields = '';
  weekDays.forEach((day) => {
    weekDaysFields += `${day}: ${fieldType} `;
  });
  return weekDaysFields;
};

export default getWeekDaysFields;
