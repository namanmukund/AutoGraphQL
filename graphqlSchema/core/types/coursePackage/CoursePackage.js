import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import {
  CMS_HEAD,
  NOT_CMS_HEAD,
  SCHOOL_ADMIN,
  SUPPLY_DEMAND_ROLES,
  LEAD_PARTNER,
  SENSEI,
  PRE_SALES,
} from '../../../../constants/roles';

const CoursePackageTopicRule = `
  type CoursePackageTopicRule {
    order: Int
    topic: Topic @relation(name: "CoursePackageTopic", direction: "OneWay")
    description: String
    isRevision: Boolean @defaultValue(value: "false")
  }
`;

const CoursePackage = `
  type CoursePackage @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} },
      ], 
    rule: allow
  )
  @userPermissions(
    permissions:[
      { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      { userRole: ${SUPPLY_DEMAND_ROLES} appName: "*" operations: ${READ} }
      { userRole: ${LEAD_PARTNER} appName: "*" operations: ${READ} }
      { userRole: ${SENSEI} appName: "*" operations: ${READ} }
      { userRole: ${PRE_SALES} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  )  
  {
    title: String! @length(min: 3, max: 100) @trim
    internalName: String @trim
    bannerTitle: String
    version: Int @defaultValue(value: 1)
    bannerDescription: String
    category: CourseCategory!
    description: String @length(min: 6, max: 1000) @trim
    status: ContentStatus! @defaultValue(value: "unpublished")
    thumbnail: File @relation(name: "CourseThumbnail", direction: "OneWay")
    bannerThumbnail: File @relation(name: "CourseBannerThumbnail", direction: "OneWay")
    courses: [Course] @relation(name: "CoursePackageCourses", direction: "OneWay")
    topics: [CoursePackageTopicRule]
    revisionSessionCount: Int
    secondaryCategory: String
    minGrade: Int
    maxGrade: Int
  }
`;

export default [CoursePackage, CoursePackageTopicRule];
