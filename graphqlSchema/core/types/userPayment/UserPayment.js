import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const UserPayment = `
  type UserPayment @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
    user: User! @relation(name: "UserPayment", direction: "OneWay")
    product: Product! @relation(name: "ProductUserPayment", direction: "OneWay")
    amount: Float!
    isDiscountUsed: Boolean @defaultValue(value: "false")
    discount: Discount @relation(name: "Discount", direction: "OneWay")
    status: String!
  }
`;

export default UserPayment;
