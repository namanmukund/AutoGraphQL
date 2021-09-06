const fetchUserMerchants = (phone, email) => `
{
  userMerchants(filter: {
    or: [
      {parentPhone_number_subDoc:"${phone}"},
      {parentEmail:"${email}"}
    ]
  }){
    id
    parentPhone{
      number
    }
    parentEmail
    productId
    merchantCampaignType
    grade
    studentName
    merchantName
    merchantDiscountCode
    merchantPrice
    finalPreDiscountedPrice
    finalPostDiscountedPrice
    paymentStatus
  }
}
`;

export default fetchUserMerchants;
