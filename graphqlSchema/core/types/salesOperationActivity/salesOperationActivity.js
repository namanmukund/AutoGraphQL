import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SalesOperationActivity = `
  type SalesOperationActivity @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ],
    rule: allow
  )
  ${getPermissionSchemaString('SalesOperationActivity')}
   {
    loggedBy: User @relation(name:"SalesOperationActivityLoggedBy", direction: "OneWay")
    salesOperation: SalesOperation! @relation(name:"SalesOperationActivitySalesOperation")
    actionOn: SalesOperationActionOn
    currentData: String
    oldData: String
  }
`;

export default SalesOperationActivity;
