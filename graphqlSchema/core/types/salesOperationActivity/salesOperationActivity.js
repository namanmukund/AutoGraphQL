import { TMS } from '../../../../constants';
import {
  MENTOR, TRANSFORMATION_TEAM, UMS_HEAD, UMS_VIEWER,
} from '../../../../constants/roles';

const SalesOperationActivity = `
  type SalesOperationActivity @model
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
      { userRole: ${MENTOR} appName: "*" operations: "*" },
      { userRole: ${TRANSFORMATION_TEAM} appName: "*" operations: "*" },
      ], 
    rule: allow
  ) 
   { 
    loggedBy: User @relation(name:"SalesOperationActivityLoggedBy", direction: "OneWay")
    salesOperation: SalesOperation! @relation(name:"SalesOperationActivitySalesOperation")
    actionOn: SalesOperationActionOn
    currentData: String
    oldData: String
  }
`;

export default SalesOperationActivity;
