import { ADMIN, NOT_ADMIN } from '../../../../constants/roles';
import { READ } from '../../../../constants/graphqlOperations';

const User = `
  type User @model {
    phoneOtp: Int @writeOnly
    phoneOtpCreationDate: Date @writeOnly
    emailOtp: Int @writeOnly
    emailOtpCreationDate: Date @writeOnly
    name: String @trim
    role: UserRole! @defaultValue(value: "selfLearner") 
          @userPermissions(
            permissions:[
              { userRole: ${ADMIN} appName: "*" operations: "*" },
              { userRole: ${NOT_ADMIN} appName: "*" operations: ${READ} }
              ], 
            rule: allow
          ) 
    status: Status! @defaultValue(value: "active") @readOnly
    username: String @uniqueOrEmpty @trim
    password: String @filterOff @writeOnly
    savedPassword: String @filterOff 
                 @userPermissions(
                  permissions:[
                    { userRole: ${ADMIN} appName: "*" operations: "*" }
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
    parentProfile: ParentProfile @relation(name:"ParentProfileUser")
    profilePic: File @relation(name: "UserProfilePic", direction: "OneWay")
  }
`;

export default [User];
