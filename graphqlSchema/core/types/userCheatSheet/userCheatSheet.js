import { TBA, TLA, TMS } from '../../../../constants';

const UserCheatSheet = `
  type UserCheatSheet @model
  @appPermissions(
    permissions:[
      { appName: "${TLA}" operations: "*" },
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: "*" },
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
