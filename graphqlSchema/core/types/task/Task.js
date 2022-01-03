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
    mentorDemandSingleSlot: MentorDemandSingleSlot @relation(name: "TaskMentorDemandSingleSlot", direction: "OneWay")
    leadStatus: TaskLeadStatus @defaultValue(value: "verificationPending")
    bookingStatus: TaskBookingStatus @defaultValue(value: "notConfirmed")
    bookingComment: String
    rejectionComment: String
    assignedTo: User @relation(name: "TaskUserAssignedTo", direction: "OneWay")
    assignedBy: User @relation(name: "TaskUserAssignedBy", direction: "OneWay")
    comment: String
    contactMsmReason: TaskContactReason
    hasSameMentorAccept: Boolean
    contactMsmComment: String
    isHighPriority: Boolean
    broadcastCount: Int
    allotmentCount: Int
  }
`;

export default [Task];
