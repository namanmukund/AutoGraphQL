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
    product: Product! @relation(name: "ProductDiscount")
    percentage: Float!
    code: String!
    expiryDate: Date!
    description: String
    isDefault: Boolean @defaultValue(value: "false")
    isDefaultMerchant: Boolean @defaultValue(value: "false")
  }
`;

export default Discount;
