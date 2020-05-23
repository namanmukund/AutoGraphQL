import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

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
  {
    course: Course! @relation(name: "CourseProduct")
    title: String!
    description: String
    price: PriceInputType!
    status: ContentStatus! @defaultValue(value: "unpublished")
    userRole: UserRole! @defaultValue(value: "selfLearner")
  }
`;

export default [Product, priceInputType];
