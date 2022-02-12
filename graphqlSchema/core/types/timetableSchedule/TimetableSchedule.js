import getSlotTimeFields from '../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../functions/getWeekDaysFields';
import getWeekDaysClassModeFields from '../../functions/getWeekDaysClassModeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);
const weekDaysClassModeFields = getWeekDaysClassModeFields('ClassMode');

const TimetableSchedule = `
  type TimetableSchedule @model {
    type: TimetableScheduleType!
    eventType: TimetableScheduleEventType
    startDate: Date
    endDate: Date
    ${slotTimeFields}
    ${weekDaysFields}
    ${weekDaysClassModeFields}
    school: School @relation(name: "TimetableScheduleSchool")
    batch: Batch @relation(name: "TimetableScheduleBatch")
}`;

export default [TimetableSchedule];
