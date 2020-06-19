import { TLA, TMS, TWA } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserCredit = `
  type UserCredit @model
   @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )  
   {  
    user: User! @relation(name: "UserCreditUser", direction: "OneWay")
    credits: Int! @readOnly
  }
`;

export default UserCredit;
