import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const User = `
  type User @model 
  ${getPermissionSchemaString('User')}
  {
    name: String @trim @nameCase
    role: UserRole! @defaultValue(value: "user") ${getPermissionSchemaString('User', 'role')}
    status: Status! @defaultValue(value: "active") @readOnly
    username: String @uniqueOrEmpty @trim
    password: String @filterOff @writeOnly
    email: String @uniqueOrEmpty @trim
    emailVerified: Boolean @defaultValue(value: "false") @readOnly
    phone: Phone @uniqueOrEmpty
    phoneVerified: Boolean @defaultValue(value: "false")
    dateOfBirth: Date
    gender: Gender
    bio: String
    profile: UserProfile @relation(name: "UserProfileRelation")
    profilePic: File @relation(name: "UserProfilePic", direction: "OneWay", isSubset: true)
    posts: [Post] @relation(name: "UserPosts")
    comments: [Comment] @relation(name: "UserComments")
    lastActive: Date
    displayName: String
    roles: [UserRole]
  }
`;

export default [User];
