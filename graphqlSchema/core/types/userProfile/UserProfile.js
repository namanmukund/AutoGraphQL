import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UserProfile = `
  type UserProfile @model 
  ${getPermissionSchemaString('UserProfile')}
  {
    user: User @relation(name: "UserProfileRelation")
    headline: String @trim
    bio: String
    website: String @trim
    github: String @trim
    twitter: String @trim
    linkedin: String @trim
    location: String
    company: String
    avatarUrl: String
    skills: [String]
  }
`;

export default [UserProfile];
