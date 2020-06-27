import { NOT_UMS_HEAD, UMS_HEAD } from '../../../../constants/roles';
import { EXCEPT_DELETE, READ } from '../../../../constants/graphqlOperations';

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
    inviteCode: String @uniqueOrEmpty @readOnly
    fromReferral: Boolean @defaultValue(value: "false") @readOnly
    giftVoucherApplied: Boolean @defaultValue(value: "false") @readOnly
    signUpBonusCredited: Boolean @defaultValue(value: "false") @readOnly
    signUpBonusNotified: Boolean @defaultValue(value: "false")
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
    isSetPassword: Boolean @defaultValue(value: "false")
    socialProfilePic: String
    gmailAzp: String @writeOnly
    gmailAud: String @writeOnly
    gmailSub: String @writeOnly
    gmailLocale: String @writeOnly
    isGmailLogin: Boolean @defaultValue(value: "false")
    isFacebookLogin: Boolean @defaultValue(value: "false")
    facebookId: String @writeOnly
    studentProfile: StudentProfile @relation(name:"StudentProfileUser", isSubset: true)
    parentProfile: ParentProfile @relation(name:"ParentProfileUser", isSubset: true)
    profilePic: File @relation(name: "UserProfilePic", direction: "OneWay", isSubset: true)
    
  }
`;

export default [User];
