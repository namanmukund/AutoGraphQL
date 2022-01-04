import { READ } from '../../../../constants/graphqlOperations';
import { TMS, TLA, TWA } from '../../../../constants';
import { CREATED } from '../../../../constants/subscriptionEvents';

const Notification = `
  type Notification @model
  @appPermissions(
    permissions: [
    { appName: "${TMS}" operations: "*" },
    { appName: "${TLA}" operations: ${READ} },
    { appName: "${TWA}" operations: ${READ} }
  ],
    rule: allow
  )
  @subscribe(events: [${CREATED}])
  {
    title: String! @trim
    description: String @trim
    from: User @relation(name: "NotificationUserFrom", direction: "OneWay")
    to: [User]! @relation(name: "NotificationUserTo", direction: "OneWay")
    type: String
    tag: String
    mentorMenteeSession: MentorMenteeSession @relation(name: "NotificationMentorMenteeSession", direction: "OneWay")
    menteeSession: MenteeSession @relation(name: "NotificationMenteeSession", direction: "OneWay")
    batchSession: BatchSession @relation(name: "NotificationBatchSession", direction: "OneWay")
    mentorAvailabilitySlot: MentorAvailabilitySlot @relation(name: "NotificationMentorAvailabilitySlot", direction: "OneWay")
  }
`;

export default [Notification];
