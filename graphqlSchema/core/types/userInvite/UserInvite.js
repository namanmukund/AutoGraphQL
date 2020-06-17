// import { READ } from '../../../../constants/graphqlOperations';
// import { TLA, TMS, TWA } from '../../../../constants';
// import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const UserInvite = `
  type UserInvite @model 
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
