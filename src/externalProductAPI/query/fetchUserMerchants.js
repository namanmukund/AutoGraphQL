const fetchUserMerchants = (phone, email, id, productId) => `
{
  userMerchants(filter: {
    or:[
      {and: [
        {
          or: [
            {parentPhone_number_subDoc:"${phone}"},
            {parentEmail:"${email}"},
          ]
        },
        ${productId ? `{productId: "${productId}"},` : ''}
      ]},
      ${id ? `{id: "${id}"},` : ''}
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
