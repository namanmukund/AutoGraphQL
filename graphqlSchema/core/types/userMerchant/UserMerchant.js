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
    externalProductId: String
    productName: String
    city: String
    state: String
    pincode: String
    joiningDate: Date
    purchaseDate: Date
    merchantCampaignType: String
    grade: Grade
    parentName: String
    studentName: String
    merchantName: String
    merchantDiscountCode: String
    merchantPrice: Int
    merchantDiscountPrice: Int
    merchantSellingPrice: Int
    paymentStatus: Boolean! @defaultValue(value: "false")
    merchantTransactionId: String
    statusLog: String
  }
`;

export default UserMerchant;
