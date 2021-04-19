import { TBA, TLA, TWA } from '../../../../constants';

const UserCheatSheet = `
  type UserCheatSheet @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TWA}" operations: "*" },
      ], 
    rule: allow
  )
  {
    isBookmarked: Boolean @defaultValue(value: "false")
    course: Course @relation(name: "UserCourse", direction: "OneWay")
    user: User @relation(name: "User", direction: "OneWay")
    cheatsheet: CheatSheet @relation(name: "userCheat", direction: "OneWay")
  }
`;

export default UserCheatSheet;
