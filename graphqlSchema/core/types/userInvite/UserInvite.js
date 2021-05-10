import { READ } from '../../../../constants/graphqlOperations';
import {
  TAA, TLA, TMS, TWA,
} from '../../../../constants';

const UserInvite = `
  type UserInvite @model 
    @appPermissions(
      permissions:[
        { appName: "${TMS}" operations: ${READ} },
        { appName: "${TLA}" operations: ${READ} },
        { appName: "${TWA}" operations: ${READ} },
        { appName: "${TAA}" operations: ${READ} }
        ], 
      rule: allow
  )
   {  
    invitedBy: User @relation(name: "UserInviteInvitedBy", direction: "OneWay")
    acceptedBy: User @relation(name: "UserInviteAcceptedBy", direction: "OneWay")
    registrationVerified: Boolean @defaultValue(value: "false")
    registrationVerifiedDate: Date
    trialTaken: Boolean @defaultValue(value: "false")
    trialTakenDate: Date
    coursePurchased: Boolean @defaultValue(value: "false")
    coursePurchasedDate: Date
  }
`;

export default UserInvite;
