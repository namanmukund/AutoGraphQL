import { TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SalesOperationLog = `
  type SalesOperationLog @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      ],
    rule: allow
  )
  
  ${getPermissionSchemaString('SalesOperationLog')}
   {
    loggedBy: User @relation(name:"SalesOperationLogLoggedBy", direction: "OneWay")
    salesOperation: SalesOperation @relation(name:"SalesOperationLogSalesOperation")
    log: String
    type: SalesOperationLogType
    topic: Topic @relation(name: "SalesOperationLogTopic", direction: "OneWay")
  }
`;

export default SalesOperationLog;
