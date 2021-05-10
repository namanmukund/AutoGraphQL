import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const priceInputType = `
  type PriceInputType {
    amount: Float!
    currency: String! @defaultValue(value: "RS")
 }`;

const Product = `
  type Product @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  ${getPermissionSchemaString('Product')}
  {
    course: Course! @relation(name: "CourseProduct")
    title: String!
    description: String
    price: PriceInputType!
    status: ContentStatus! @defaultValue(value: "unpublished")
    type: ProductType! @defaultValue(value: "oneToOne")
    userRole: UserRole! @defaultValue(value: "selfLearner")
    discounts: [Discount] @relation(name: "ProductDiscount")
    isDemoPack: Boolean @defaultValue(value: "false")
    country: Country @defaultValue(value: "india")
    school: School @relation(name: "SchoolProduct")
    targetUserType: ProductTargetUserType @defaultValue(value: "b2c")
  }
`;

export default [Product, priceInputType];
