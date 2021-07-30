import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  CMS_HEAD,
  NOT_CMS_HEAD,
  SCHOOL_ADMIN,
} from '../../../../constants/roles';

// video, lo, chat, pq, coding assignment, home assignment, quiz
const CourseComponentsRule = `
  type CourseComponentsRule {
   componentName: TopicComponents
   childComponentName: ChildTopicComponents
   order: Int
   max: Int @defaultValue(value: 1)
   min: Int @defaultValue(value: 1)
 }`;

const ThemeType = `
 type ThemeType {
   primaryColor: String
   secondaryColor: String
   backdropColor: String
 }
`;

const Course = `
  type Course @model 
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
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    order: Int
    title: String!
    bannerTitle: String
    bannerDescription: String
    category: CourseCategory!
    description: String @length(min: 6, max: 1000) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    chapters: [Chapter] @relation(name: "CourseChapter")
    products: [Product] @relation(name: "CourseProduct")
    mentorPricings: [MentorPricing] @relation(name: "CourseMentorPricing")
    thumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
    bannerThumbnail: File @relation(name: "CourseBannerThumbnail", direction: "OneWay")
    topics: [Topic] @relation(name: "CourseTopic")
    secondaryCategory: String
    theme: [ThemeType]
    targetGroup: [ProductTargetUserType]
    courseComponentRule: [CourseComponentsRule]
    badges: [Badge] @relation(name: "CourseBadge")
    badgeDescription: String @uniqueOrEmpty @trim
    projectsCount: Int
  }
`;

export default [Course, CourseComponentsRule, ThemeType];
