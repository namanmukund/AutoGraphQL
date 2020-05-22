import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const Discount = `
  type Discount @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    product: Product! @relation(name: "ProductDiscount", direction: "OneWay")
    percentage: Int!
    code: String!
    expiryDate: Date!
  }
`;

export default Discount;
