import { TMS } from '../../../../constants';
import { UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const SalesOperation = `
  type SalesOperation @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )  
  @userPermissions(
    permissions:[
      { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" }
      ], 
    rule: allow
  ) 
   { 
    userVerificationStatus: SalesTeamStatus @defaultValue(value: "pending")
    userResponseStatus: UserBehaviourStatus @defaultValue(value: "pending")
    overallFeedback: String
    userResponseStatusUpdateDate: Date 
    client: User @relation(name:"SalesOperationClient", direction: "OneWay")
    monitoredBy: User @relation(name:"SalesOperationMonitoredBy", direction: "OneWay")
    salesOperationLog: [SalesOperationLog] @relation(name:"SalesOperationLogSalesOperation")
  }
`;

export default SalesOperation;
