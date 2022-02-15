import getSlotTimeFields from '../../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../../functions/getWeekDaysFields';
import getWeekDaysClassModeFields from '../../../functions/getWeekDaysClassModeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);
const weekDaysClassModeFields = getWeekDaysClassModeFields('Boolean', false);

const ScheduleSessionsInput = `
  input ScheduleSessionsInput {
    scheduleSessionType: ScheduleSessionType
    adhocSessionType: AdhocSessionType
    ${slotTimeFields}
    ${weekDaysFields}
    ${weekDaysClassModeFields}
    startDate: Date
    endDate: Date
    startTime: Int @length(min: 0, max: 59)
    endTime: Int @length(min: 0, max: 59)
    batchId: String
    courseId: String
    topicId: String
    forceShiftSessions: Boolean @defaultValue(value: "false")
    forceScheduleSessions: Boolean @defaultValue(value: "false")
    isRecurring: Boolean @defaultValue(value: "false")
  }
`;

export default ScheduleSessionsInput;
