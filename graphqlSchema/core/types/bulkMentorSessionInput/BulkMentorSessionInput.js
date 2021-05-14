import getSlotTimeFields from '../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../functions/getWeekDaysFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);

const MentorTimeTableRuleInput = `
  input MentorTimeTableRuleInput {
   startDate: Date!
   endDate: Date!
   ${slotTimeFields}
   ${weekDaysFields}
 }`;

const BulkMentorSessionInput = `
  input BulkMentorSessionInput {
    timeTableRule: MentorTimeTableRuleInput!
    userId: String!
  }
`;

export default [BulkMentorSessionInput, MentorTimeTableRuleInput];
