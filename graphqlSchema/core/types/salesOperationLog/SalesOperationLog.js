import { TMS } from '../../../../constants';
import { UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

const SalesOperationLog = `
  type SalesOperationLog @model
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
    loggedBy: User @relation(name:"SalesOperationLogLoggedBy", direction: "OneWay")
    salesOperation: SalesOperation @relation(name:"SalesOperationLogSalesOperation")
    log: String
    type: SalesOperationLogType
    topic: Topic @relation(name: "SalesOperationLogTopic", direction: "OneWay")
  }
`;

export default SalesOperationLog;
