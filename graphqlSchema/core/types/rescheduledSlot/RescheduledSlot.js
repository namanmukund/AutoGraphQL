import { TBA } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const DateAndTimeType = `
  type DateAndTimeType {
   sessionDate: Date
   ${slotTimeFields}
 }`;

const RescheduledSlot = `
  type RescheduledSlot @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" }
      ], 
    rule: allow
  )
  {
    oldSessionTime: DateAndTimeType
    newSessionTime: DateAndTimeType
    mentorMenteeSession: MentorMenteeSession @relation(name: "RescheduledSlotMentorMenteeSession", direction: "OneWay")
    batchSession: BatchSession @relation(name: "RescheduledSlotBatchSession", direction: "OneWay")
  }
`;

export default [RescheduledSlot, DateAndTimeType];
