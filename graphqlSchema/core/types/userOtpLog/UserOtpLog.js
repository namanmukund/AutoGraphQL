import { TBA, TMS } from '../../../../constants';
import { READ } from '../../../../constants/graphqlOperations';

const UserOtpLog = `
  type UserOtpLog @model 
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: ${READ} },
      ], 
    rule: allow
  )
  {
    user: User! @relation(name: "UserOtpLogUser", direction: "OneWay")
    phoneOtp: Int @writeOnly
}`;

export default UserOtpLog;
