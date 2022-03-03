import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';
import {
  MENTOR, SALES_EXECUTIVE, SCHOOL_ADMIN, SENSEI, UMS_HEAD,
} from '../../../../constants/roles';
import getSlotTimeFields from '../../functions/getSlotTimeFields';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const AdhocSession = `
  type AdhocSession @model {
    course: Course @relation(name: "AdhocSessionCourse", direction: "OneWay")
    batch: Batch! @relation(name: "AdhocSessionBatch", direction: "OneWay")
    previousTopic: Topic @relation(name: "AdhocSessionTopic", direction: "OneWay")
    type: AdhocSessionType!
    sessionMode: SessionMode @defaultValue(value: "online")
    order: Int
    mentorSession: MentorSession @relation(name: "AdhocSessionMentorSession")
    bookingDate: Date!
    startMinutes: Int @defaultValue(value: "0")
    endMinutes: Int @defaultValue(value: "0")
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
