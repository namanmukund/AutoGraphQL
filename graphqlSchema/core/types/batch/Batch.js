import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../functions/getWeekDaysFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);

const BatchTimeTableRules = `
  type BatchTimeTableRules {
   startDate: Date
   endDate: Date
   ${slotTimeFields}
   ${weekDaysFields}
 }`;

const Batch = `
  type Batch @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "BatchCurrentComponentStatusCourse", direction: "OneWay")
    allottedMentor: User! @relation(name:"BatchMentor", direction: "OneWay")
    code: String! @uniqueOrEmpty @trim
    description: String
    students: [StudentProfile] @relation(name: "BatchStudentProfile")
    currentComponent: BatchCurrentComponentStatus @relation(name: "BatchCurrentComponentStatusBatch", isSubset: true)
    type: BatchType @defaultValue(value: "normal")
    campaign: Campaign @relation(name: "CampaignBatch")
    classes: [SchoolClass] @relation(name: "BatchSchoolClass", direction: "OneWay")
    school: School @relation(name: "BatchSchool", direction: "OneWay")
    timeTableRules: [BatchTimeTableRules]
  }
`;

export default [Batch, BatchTimeTableRules];
