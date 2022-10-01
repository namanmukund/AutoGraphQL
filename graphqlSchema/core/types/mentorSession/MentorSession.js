import getSlotTimeFields from '../../functions/getSlotTimeFields';
import {
  AUDIT_ROLES, NOT_UMS_HEAD_AND_MENTOR, SALES_EXECUTIVE,
  SCHOOL_ADMIN, SUPPLY_DEMAND_ROLES, UMS_HEAD_AND_MENTOR,
  LEAD_PARTNER,
  SENSEI,
} from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const AcceptanceObject = `
  type AcceptanceObject {
   slotName: Slot
   date: Date
   mentorAvailabilitySlotId: String
   menteeSessionId: String
   batchSessionId: String
   requestType: RequestType
 }`;

const RejectionObject = `
  type RejectionObject {
   slotName: Slot
   date: Date
   mentorAvailabilitySlotId: String
   menteeSessionId: String
   batchSessionId: String
   requestType: RequestType
 }`;

const MentorSession = `
  type MentorSession @model
    @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: "*" }
      ], 
    rule: allow
  )  
  @userPermissions(
  permissions:[
    { userRole: ${UMS_HEAD_AND_MENTOR} appName: "*" operations: "*" },
    { userRole: ${SALES_EXECUTIVE} appName: "*" operations: "*" },
    { userRole: ${NOT_UMS_HEAD_AND_MENTOR} appName: "*" operations: ${READ} }
    { userRole: ${AUDIT_ROLES} appName: "*" operations: ${READ} },
    { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
    { userRole: ${SUPPLY_DEMAND_ROLES} appName: "*" operations: ${READ} }
    { userRole: ${LEAD_PARTNER} appName: "*" operations: ${READ} }
    { userRole: ${SENSEI} appName: "*" operations: ${READ} }
    ], 
  rule: allow
  ) 
  {
    user: User! @relation(name: "MentorSessionUser", direction: "OneWay")
    course: Course @relation(name: "MentorSessionCourse", direction: "OneWay")
    coursePackage: CoursePackage @relation(name: "MentorSessionCoursePackage", direction: "OneWay")
    availabilityDate: Date!
    sessionType: SessionType @defaultValue(value: "trial")
    ${slotTimeFields}
    mentorMenteeSessions: [MentorMenteeSession] @relation(name: "SessionDataMentorSession")
    batchSessions: [BatchSession] @relation(name: "BatchSessionMentorSession")
    adhocSessions: [AdhocSession] @relation(name: "AdhocSessionMentorSession")
    b2b2cBatch: [Batch] @relation(name: "BatchMentorSession")
    mentorAvailabilitySlots: [MentorAvailabilitySlot] @relation(name:"MentorAvailabilitySlotMentorSession")
    acceptanceObjects: [AcceptanceObject]
    rejectionObjects: [RejectionObject]
    startMinutes: Int @defaultValue(value: "0")
    endMinutes: Int @defaultValue(value: "0")
}`;

export default [MentorSession, AcceptanceObject, RejectionObject];
