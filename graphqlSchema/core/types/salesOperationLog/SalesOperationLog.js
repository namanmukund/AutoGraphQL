import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

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
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" },
      { userRole: ${MENTOR} appName: "*" operations: "*" }
      ], 
    rule: allow
  ) 
   { 
    loggedBy: User @relation(name:"SalesOperationLogLoggedBy", direction: "OneWay")
    salesOperation: SalesOperation @relation(name:"SalesOperationLogSalesOperation")
    log: String
    type: SalesOperationLogType
    topic: Topic @relation(name: "SalesOperationLogTopic", direction: "OneWay")
    potentialLead: Boolean
    mayConvert: Boolean
    pricingIssue: Boolean
    disInterested: Boolean
    differentStream: Boolean
    dump: Boolean
    unfit: Boolean
    knowCoding: Boolean
    hasRescheduled: Boolean
    internetIssue: Boolean
    zoomIssue: Boolean
    laptopIssue: Boolean
    didNotRespond: Boolean
    powerCut: Boolean
    turnedUpWithoutConfirming: Boolean
    highlyInterested: Boolean  
  }
`;

export default SalesOperationLog;
