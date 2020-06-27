import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserCreditLog = `
  type UserCreditLog @model
   @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )  
   {  
    user: User! @relation(name: "UserCreditLogUser", direction: "OneWay")
    amount: Int!
    type: CreditType!
    reason: UserCreditReason!
  }
`;

export default UserCreditLog;
