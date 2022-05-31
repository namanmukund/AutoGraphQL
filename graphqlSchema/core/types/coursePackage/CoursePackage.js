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

/**
 * LOGIC for revision order:
 * revision objects in topic rule are given revisionOrder: Int, title: String, description: String (optional), previousTopicOrder: Int and isRevision: true
 * revision objects always have an previousTopicOrder field equal to the order of the topic that is immediately earlier to them in schedule (NOTE : revision sessions cannot be taken as the first class in the curriculum)
 * For example: consider the ordering of topics learning1, learning2, revision1, revision2, learning3, revision3..
 * they stored as : coursePackage.topics = [
 *  {
 *    order: 1,
 *    topic: {
 *      title: learning1,
 *    },
 *    isRevision: false
 *  },
 * {
 *    order: 2,
 *    topic: {
 *      title: learning2,
 *    },
 *    isRevision: false
 *  },
 * {
 *    previousTopicOrder: 2,
 *    title: revision1,
 *    isRevision: true,
 *    revisionOrder: 1
 *  },
 * {
 *    previousTopicOrder: 2,
 *    title: revision2,
 *    isRevision: true,
 *    revisionOrder: 2
 *  },
 * {
 *    order: 3,
 *    topic: {
 *      title: learning3,
 *    }
 *  },
 * {
 *    previousTopicOrder: 3,
 *    title: revision3,
 *    isRevision: true,
 *    revisionOrder: 3
 *  }
 * ]
 */

const CoursePackageTopicRule = `
  type CoursePackageTopicRule {
    order: Int
    topic: Topic @relation(name: "CoursePackageTopic", direction: "OneWay")
    title: String
    description: String
    isRevision: Boolean @defaultValue(value: "false")
    previousTopicOrder: Int
    revisionOrder: Int
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
