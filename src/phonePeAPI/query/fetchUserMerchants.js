const fetchUserMerchants = (phone, email, id) => `
{
  userMerchants(filter: {
    or:[
      {parentPhone_number_subDoc:"${phone}"},
      {parentEmail:"${email}"},
      {id: "${id}"}
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
    merchantDiscountPrice
    merchantSellingPrice
    paymentStatus
    merchantTransactionId
  }
}
`;

export default fetchUserMerchants;
