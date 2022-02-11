import getSlotTimeFields from '../../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../../functions/getWeekDaysFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);

const ScheduleSessionsInput = `
  input ScheduleSessionsInput {
    scheduleSessionType: ScheduleSessionType
    ${slotTimeFields}
    ${weekDaysFields}
    startDate: Date
    endDate: Date
    batchId: String
    courseId: String
    topicId: String
    forceShiftSessions: Boolean @defaultValue(value: "false")
    forceScheduleSessions: Boolean @defaultValue(value: "false")
    isRecurring: Boolean @defaultValue(value: "false")
  }
`;

export default ScheduleSessionsInput;
