// import { READ } from '../../../../constants/graphqlOperations';
// import { TLA, TMS, TWA } from '../../../../constants';
// import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const InviteUser = `
  type InviteUser @model 
   {  
    invitedBy: User @relation(name: "InviteUserInvitedBy", direction: "OneWay")
    acceptedBy: User @relation(name: "InviteUserAcceptedBy", direction: "OneWay")
    registrationVerified: Boolean @defaultValue(value: "false")
    registrationVerifiedDate: Date
    trialTaken: Boolean @defaultValue(value: "false")
    trialTakenDate: Date
    coursePurchased: Boolean @defaultValue(value: "false")
    coursePurchasedDate: Date
  }
`;

export default InviteUser;
