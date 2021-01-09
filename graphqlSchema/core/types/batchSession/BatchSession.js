import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const BatchSession = `
  type BatchSession @model {
    batch: Batch! @relation(name: "BatchSessionBatch", direction: "OneWay")
    topic: Topic! @relation(name: "BatchSessionTopic", direction: "OneWay")
    bookingDate: Date!
    scheduleRunStatus: ScheduleRunStatus
    ${slotTimeFields}
}`;

export default [BatchSession];
