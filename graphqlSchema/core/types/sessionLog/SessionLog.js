import { TBA, TMS } from '../../../../constants';
import getSlotTimeFields from '../../functions/getSlotTimeFields';
import { READ } from '../../../../constants/graphqlOperations';

const slotTimeFields = getSlotTimeFields('Boolean', false);

const SessionLog = `
  type SessionLog @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: ${READ} }
      ],
    rule: allow
  )
  {
    client: User @relation(name: "SessionLogsClientUser", direction: "OneWay")
    course: Course @relation(name: "SessionLogsCourse", direction: "OneWay")
    topic: Topic! @relation(name: "SessionLogsTopic", direction: "OneWay")
    action: SessionLogAction!
    actionBy: User! @relation(name: "SessionLogsActionByUser", direction: "OneWay")
    sessionDate: Date
    ${slotTimeFields}
    sessionStatus: SessionStatus
    mentor: User @relation(name: "SessionLogsMentorUser", direction: "OneWay")
    mentorAvailabilityDate: Date
    batchCode: String
  }
`;

export default [SessionLog];
