import { READ } from '../../../../constants/graphqlOperations';
import { TMS, TLA, TWA } from '../../../../constants';

const Task = `
  type Task @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ],
    rule: allow
  )
  {
    status: TaskStatus @defaultValue(value: "unassigned")
    completionStatus: TaskCompletionStatus @defaultValue(value: "incomplete")
    mentorMenteeSession: MentorMenteeSession @relation(name: "TaskMentorMenteeSession", direction: "OneWay")
    menteeSession: MenteeSession @relation(name: "TaskMenteeSession", direction: "OneWay")
    batchSession: BatchSession @relation(name: "TaskBatchSession", direction: "OneWay")
    sessionLog: SessionLog @relation(name: "TaskSessionLog", direction: "OneWay")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name: "TaskMentorAvailabilitySlot", direction: "OneWay")
    leadStatus: TaskLeadStatus @defaultValue(value: "verificationPending")
    leadStatusReason: TaskLeadStatusReason @defaultValue(value: "busy")
    bookingStatus: TaskBookingStatus @defaultValue(value: "notConfirmed")
    bookingComment: String
    rejectionComment: String
    assignedTo: User @relation(name: "TaskUserAssignedTo", direction: "OneWay")
    assignedBy: User @relation(name: "TaskUserAssignedBy", direction: "OneWay")
    comment: String
    contactMsmReason: TaskContactReason
    hasSameMentorAccepted: Boolean @defaultValue(value: "false")
    contactMsmComment: String
    isHighPriority: Boolean @defaultValue(value: "false")
    broadcastCount: Int @defaultValue(value: "0")
    allotmentCount: Int @defaultValue(value: "0")
  }
`;

export default [Task];
