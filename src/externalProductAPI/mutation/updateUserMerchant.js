const updateUserMerchant = (userMerchantId, queryObj) => `
mutation{
  updateUserMerchant(
    id: "${userMerchantId}"
    input:{
    ${queryObj.parentName ? `parentName: "${queryObj.parentName}",` : ''}
    ${queryObj.phone ? `parentPhone:{
      number: "${queryObj.phone}",
      countryCode:"+91"
    },` : ''}
    ${queryObj.email ? `parentEmail: "${queryObj.email}",` : ''}
    ${queryObj.productId ? `productId:"${queryObj.productId}",` : ''}
    ${queryObj.studentName ? `studentName: "${queryObj.studentName}",` : ''}
    ${queryObj.grade ? `grade: Grade${grade},` : ''}
    ${typeof queryObj.status === 'boolean' ? `paymentStatus:${queryObj.status}, ` : ''}
    ${queryObj.city ? `city: "${queryObj.city}",` : ''}
    ${queryObj.state ? `state: "${queryObj.state}",` : ''}
    ${queryObj.pincode ? `pincode: "${queryObj.pincode}",` : ''}
    ${queryObj.joiningDate ? `joiningDate: "${queryObj.joiningDate.toISOString()}",` : ''}
    ${queryObj.externalProductId ? `externalProductId: "${queryObj.externalProductId}",` : ''}
    ${queryObj.merchantSellingPrice ? `merchantSellingPrice: ${queryObj.merchantSellingPrice},` : ''}
    ${queryObj.purchaseDate ? `purchaseDate: "${queryObj.purchaseDate.toISOString()}",` : ''}
  }){
    id
  }
}
`;

export default updateUserMerchant;
