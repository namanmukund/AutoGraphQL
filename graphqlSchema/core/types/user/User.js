import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

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
  ${getPermissionSchemaString('User')}
  {
    phoneOtp: Int @writeOnly
    phoneOtpCreationDate: Date @writeOnly
    emailOtp: Int @writeOnly
    emailOtpCreationDate: Date @writeOnly
    name: String @trim
    role: UserRole! @defaultValue(value: "selfLearner") ${getPermissionSchemaString('User', 'role')}
    status: Status! @defaultValue(value: "active") @readOnly
    username: String @uniqueOrEmpty @trim
    password: String @filterOff @writeOnly
    savedPassword: String @filterOff ${getPermissionSchemaString('User', 'savedPassword')}
    email: String @uniqueOrEmpty @trim
    emailVerified: Boolean @defaultValue(value: "false") @readOnly
    phone: Phone @uniqueOrEmpty
    phoneVerified: Boolean @defaultValue(value: "false")
    dateOfBirth: Date
    gender: Gender
    city: String
    isBookSessionReminderSent: Boolean @defaultValue(value: "false")
    country: Country @defaultValue(value: "india")
    timezone: String
    isSetPassword: Boolean @defaultValue(value: "false")
    studentProfile: StudentProfile @relation(name:"StudentProfileUser", isSubset: true)
    parentProfile: ParentProfile @relation(name:"ParentProfileUser", isSubset: true)
    mentorProfile: MentorProfile @relation(name:"MentorProfileUser", isSubset: true)
    salesExecutiveProfile: SalesExecutiveProfile @relation(name:"SalesExecutiveProfileUser", isSubset: true)
    school: School @relation(name:"UserSchool")
    profilePic: File @relation(name: "UserProfilePic", direction: "OneWay", isSubset: true)
    userLocationLog: UserLocationLog @relation(name:"UserLocationLogUser", isSubset: true) 
    utmSource: String
    utmCampaign: String
    utmTerm: String
    utmContent: String
    utmMedium: String
    source: UserOriginSource @defaultValue(value: "website")
    ${affilateInfo}  
    ${socialInfo}
    ${promotionalInfo}
    verificationStatus: VerificationStatus @defaultValue(value: "empty")
  }
`;

export default [User];
