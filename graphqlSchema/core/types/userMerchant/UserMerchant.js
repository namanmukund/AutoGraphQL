import { TBA } from '../../../../constants';

const UserMerchant = `
  type UserMerchant @model
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" }
      ], 
    rule: allow
  )
  {
    id: String!
    parentPhone: String
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
    paymentStatus: String! @defaultValue(value: "unpaid")
  }
`;

export default UserMerchant;
