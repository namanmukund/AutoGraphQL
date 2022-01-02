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
    status: TaskStatus
    completionStatus: TaskCompletionStatus
    mentorMenteeSession: MentorMenteeSession @relation(name: "TaskMentorMenteeSession", direction: "OneWay")
    menteeSession: MenteeSession @relation(name: "TaskMenteeSession", direction: "OneWay")
    batchSession: BatchSession @relation(name: "TaskBatchSession", direction: "OneWay")
    sessionLog: SessionLog @relation(name: "TaskSessionLog", direction: "OneWay")
    leadStatus: String
    bookingStatus: String
    bookingComment: String
    rejectionComment: String
    assignedTo: User @relation(name: "TaskUserAssignedTo", direction: "OneWay")
    assignedBy: User @relation(name: "TaskUserAssignedBy", direction: "OneWay")
    comment: String
    contactReason: String
    isHighPriority: Boolean
    broadcastCount: Int
  }
`;

export default [Task];
