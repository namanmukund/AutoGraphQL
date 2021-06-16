import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const Badge = `
  type Badge @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  @userPermissions(
    permissions:[
      { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    order: Int!
    type: BadgeType!
    name: String @length(min: 3, max: 8) @trim
    description: String @length(min: 3, max: 150) @trim
    activeImage: File @relation(name: "BadgeActiveImage", direction: "OneWay")
    inactiveImage: File @relation(name: "BadgeInactiveImage", direction: "OneWay")
    topic: Topic! @relation(name: "TopicBadge")
    unlockPoint: CurrentTopicComponentType!
    status: ContentStatus! @defaultValue(value: "unpublished")
    courses: [Course] @relation(name: "CourseBadge")
  }
`;

export default Badge;
