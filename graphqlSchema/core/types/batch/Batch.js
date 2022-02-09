import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';
import getWeekDaysFields from '../../functions/getWeekDaysFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);
const weekDaysFields = getWeekDaysFields('Boolean', false);

const BatchTimeTableRule = `
  type BatchTimeTableRule {
   startDate: Date
   endDate: Date
   ${slotTimeFields}
   ${weekDaysFields}
 }`;

const B2b2cTimeTable = `
  type B2b2cTimeTable {
   bookingDate: Date
   ${slotTimeFields}
   mentorSession: MentorSession @relation(name: "BatchMentorSession")
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
    allottedMentor: User @relation(name:"BatchMentor")
    code: String! @uniqueOrEmpty @trim @uppercase
    classroomTitle: String!
    description: String
    thumbnailSmall: String
    students: [StudentProfile] @relation(name: "BatchStudentProfile")
    currentComponent: BatchCurrentComponentStatus @relation(name: "BatchCurrentComponentStatusBatch", isSubset: true)
    documentType: SessionDocumentType @defaultValue(value: "batch")
    type: BatchType @defaultValue(value: "normal")
    campaign: Campaign @relation(name: "CampaignBatch")
    classes: [SchoolClass] @relation(name: "BatchSchoolClass", direction: "OneWay")
    school: School @relation(name: "BatchSchool", direction: "OneWay")
    timeTableRule: BatchTimeTableRule
    b2b2ctimeTable: B2b2cTimeTable
    customSessionLink: String
    studentReviewsByMentor: [StudentReviewByMentor] @relation(name: "BatchStudentReviewByMentor")
    notices: [Notice] @relation(name: "BatchNotice")
  }
`;

export default [Batch, BatchTimeTableRule, B2b2cTimeTable];
