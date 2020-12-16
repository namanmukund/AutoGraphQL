import { NOT_UMS_HEAD, UMS_HEAD } from '../../../../constants/roles';
import { EXCEPT_DELETE, READ } from '../../../../constants/graphqlOperations';

const affilateInfo = `
    profession: AffiliateProfession
    secondaryRole: UserRole
`;
const socialInfo = `
    socialProfilePic: String
    gmailAzp: String @writeOnly
    gmailAud: String @writeOnly
    gmailSub: String @writeOnly
    gmailLocale: String @writeOnly
    isGmailLogin: Boolean @defaultValue(value: "false")
    isFacebookLogin: Boolean @defaultValue(value: "false")
    facebookId: String @writeOnly
`;

const promotionalInfo = `
    inviteCode: String @uniqueOrEmpty @readOnly
    fromReferral: Boolean @defaultValue(value: "false") @readOnly
    giftVoucherApplied: Boolean @defaultValue(value: "false") @readOnly
    signUpBonusCredited: Boolean @defaultValue(value: "false") @readOnly
    signUpBonusNotified: Boolean @defaultValue(value: "false")
`;

const User = `
  type User @model 
    @userPermissions(
      permissions:[
        { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
        { userRole: ${NOT_UMS_HEAD} appName: "*" operations: ${EXCEPT_DELETE} }
        ], 
      rule: allow
    ) 
  {
    phoneOtp: Int @writeOnly
    phoneOtpCreationDate: Date @writeOnly
    emailOtp: Int @writeOnly
    emailOtpCreationDate: Date @writeOnly
    name: String @trim
    role: UserRole! @defaultValue(value: "selfLearner") 
          @userPermissions(
            permissions:[
              { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
              { userRole: ${NOT_UMS_HEAD} appName: "*" operations: ${READ} }
              ], 
            rule: allow
          ) 
    status: Status! @defaultValue(value: "active") @readOnly
    username: String @uniqueOrEmpty @trim
    password: String @filterOff @writeOnly
    savedPassword: String @filterOff 
                 @userPermissions(
                  permissions:[
                    { userRole: ${UMS_HEAD} appName: "*" operations: "*" },
                    { userRole: ${NOT_UMS_HEAD} appName: "*" operations: ${READ} }
                    ], 
                  rule: allow
                )
    email: String @uniqueOrEmpty @trim
    emailVerified: Boolean @defaultValue(value: "false") @readOnly
    phone: Phone @uniqueOrEmpty
    phoneVerified: Boolean @defaultValue(value: "false")
    dateOfBirth: Date
    gender: Gender
    city: String
    isSetPassword: Boolean @defaultValue(value: "false")
    studentProfile: StudentProfile @relation(name:"StudentProfileUser", isSubset: true)
    parentProfile: ParentProfile @relation(name:"ParentProfileUser", isSubset: true)
    mentorProfile: MentorProfile @relation(name:"MentorProfileUser", isSubset: true)
    salesExecutiveProfile: SalesExecutiveProfile @relation(name:"SalesExecutiveProfileUser", isSubset: true)
    profilePic: File @relation(name: "UserProfilePic", direction: "OneWay", isSubset: true) 
    utmSource: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    utmMedium: String
    source: UserOriginSource @defaultValue(value: "website")
    ${affilateInfo}  
    ${socialInfo}
    ${promotionalInfo}
  }
`;

export default [User];
