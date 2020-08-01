import { TMS } from '../../../../constants';
import { MENTOR, UMS_HEAD, UMS_VIEWER } from '../../../../constants/roles';

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
      { userRole: ${UMS_VIEWER} appName: "*" operations: "*" },
      { userRole: ${MENTOR} appName: "*" operations: "*" }
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
    nextCallOn: Date
  }
`;

export default SalesOperation;
