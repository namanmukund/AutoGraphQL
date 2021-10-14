import getSlotTimeFields from '../../functions/getSlotTimeFields';
import {
  AUDIT_ROLES, NOT_UMS_HEAD_AND_MENTOR, SALES_EXECUTIVE, UMS_HEAD_AND_MENTOR,
} from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const MentorSession = `
  type MentorSession @model
    @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )  
  @userPermissions(
  permissions:[
    { userRole: ${UMS_HEAD_AND_MENTOR} appName: "*" operations: "*" },
    { userRole: ${SALES_EXECUTIVE} appName: "*" operations: "*" },
    { userRole: ${NOT_UMS_HEAD_AND_MENTOR} appName: "*" operations: ${READ} }
    { userRole: ${AUDIT_ROLES} appName: "*" operations: ${READ} },
    ], 
  rule: allow
  ) 
  {
    user: User! @relation(name: "MentorSessionUser", direction: "OneWay")
    course: Course @relation(name: "MentorSessionCourse", direction: "OneWay")
    availabilityDate: Date!
    sessionType: SessionType @defaultValue(value: "trial")
    ${slotTimeFields}
    mentorMenteeSessions: [MentorMenteeSession] @relation(name: "SessionDataMentorSession")
    batchSessions: [BatchSession] @relation(name: "BatchSessionMentorSession")
    adhocSessions: [AdhocSession] @relation(name: "AdhocSessionMentorSession")
    b2b2cBatch: [Batch] @relation(name: "BatchMentorSession")
    mentorDemandSingleSlots: [MentorDemandSingleSlot] @relation(name:"MentorDemandSingleSlotMentorSession")
}`;

export default [MentorSession];
