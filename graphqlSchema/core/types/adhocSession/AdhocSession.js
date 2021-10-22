import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import { UMS_HEAD } from '../../../../constants/roles';
import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const AdhocSession = `
  type AdhocSession @model
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
    { userRole: ${UMS_HEAD} appName: "*" operations: "*" }
    ],
  rule: allow
  )
  {
    course: Course @relation(name: "AdhocSessionCourse", direction: "OneWay")
    batch: Batch! @relation(name: "AdhocSessionBatch", direction: "OneWay")
    previousTopic: Topic @relation(name: "AdhocSessionTopic", direction: "OneWay")
    type: AdhocSessionType!
    order: Int
    mentorSession: MentorSession @relation(name: "AdhocSessionMentorSession")
    bookingDate: Date!
    ${slotTimeFields}
    sessionStartDate: Date
    sessionEndDate: Date
    sessionStatus: SessionStatus! @defaultValue(value: "allotted")
    sessionRecordingLink: String
    sessionCommentByMentor: String
    attendance: [BatchAttendanceType]
    mentorPaymentStatus: MentorPaymentStatus @defaultValue(value: "declined")
    paymentApprovedBy: User @relation(name: "MentorMenteeSessionPaymentApprovedUser", direction: "OneWay")
    isAudit: Boolean @defaultValue(value: "false")
}`;

export default [AdhocSession];
