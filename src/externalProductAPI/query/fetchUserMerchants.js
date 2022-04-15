const fetchUserMerchants = (phone, email, id, productId) => `
{
  userMerchants(filter: {
    or:[
      {parentPhone_number_subDoc:"${phone}"},
      {parentEmail:"${email}"},
      ${id ? `{id: "${id}"},` : ''}
      ${productId ? `{productId: "${productId}"},` : ''}
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
