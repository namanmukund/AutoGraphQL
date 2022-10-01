import getSlotTimeFields from '../../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../../functions/getWeekDaysFields';
import getWeekDaysClassModeFields from '../../../functions/getWeekDaysClassModeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);
const weekDaysClassModeFields = getWeekDaysClassModeFields('ClassMode', false);

const ScheduleSessionsRule = `
  input ScheduleSessionsRule {
    ${slotTimeFields}
    ${weekDaysFields}
    ${weekDaysClassModeFields}
    startTime: Int @length(min: 0, max: 59)
    endTime: Int @length(min: 0, max: 59)
  }
`;

export default [ScheduleSessionsRule];
