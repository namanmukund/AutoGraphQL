import { TBA, TMS } from '../../../../constants';

const UserMerchant = `
  type UserMerchant @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TMS}" operations: "*" }
      ], 
    rule: allow
  )
  {
    id: String!
    parentPhone: Phone @uniqueOrEmpty
    parentEmail: String
    productId: String!
    merchantCampaignType: String
    grade: Grade
    parentName: String
    studentName: String
    merchantName: String
    merchantDiscountCode: String
    merchantPrice: Int
    merchantDiscoutPrice: Int
    finalPreDiscountedPrice: Int
    finalPostDiscountedPrice: Int
    paymentStatus: Boolean! @defaultValue(value: "false")
    merchantTransactionId: String
    statusLog: String
  }
`;

export default UserMerchant;
