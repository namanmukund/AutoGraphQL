import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { UMS_HEAD_AND_SALES_EXECUTIVE, NOT_UMS_HEAD_AND_SALES_EXECUTIVE } from '../../../../constants/roles';

const MentorPricing = `
  type MentorPricing @model
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
      { userRole: ${UMS_HEAD_AND_SALES_EXECUTIVE} appName: "*" operations: "*" },
      { userRole: ${NOT_UMS_HEAD_AND_SALES_EXECUTIVE} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    course: Course! @relation(name: "CourseMentorPricing")
    package: CoursePackage @relation(name: "CoursePackageMentorPricing")
    sessionPrice: PriceInputType!
    bonusAmount: PriceInputType
    modelType: ProductType! @defaultValue(value: "oneToOne")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default [MentorPricing];
