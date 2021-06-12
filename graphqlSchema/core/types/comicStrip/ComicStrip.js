import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';

const ComicStrip = `
  type ComicStrip @model
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
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} },
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  {
    title: String @uniqueOrEmpty @trim
    description: String @uniqueOrEmpty @trim
    comicImages: [ComicImage] @relation(name: "ComicStripeComicImage", isSubset: true)
    learningObjectives: [LearningObjective]! @relation(name: "LearningObjectiveComicStrip")
    status: ContentStatus! @defaultValue(value: "unpublished")
    courses: [Course] @relation(name: "CourseComicStrip", direction: "OneWay")
  }
`;

export default ComicStrip;
