const GetUnlockedUserBadgeResult = `
  type GetUnlockedUserBadgeResult {
    badge: Badge @relation(name: "GetUnlockedUserBadgeResultBadge", direction: "OneWay")
    displayBadge: Boolean @defaultValue(value: "false")
  }
`;

export default [GetUnlockedUserBadgeResult];
