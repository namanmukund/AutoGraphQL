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
    ${queryObj.city ? `city: ${city},` : ''}
    ${queryObj.state ? `state: ${state},` : ''}
    ${queryObj.pincode ? `pincode: ${pincode},` : ''}
    ${queryObj.joiningDate ? `joiningDate: "${joiningDate.toISOString()}",` : ''}
    ${queryObj.externalProductId ? `externalProductId: ${externalProductId},` : ''}
    ${queryObj.merchantSellingPrice ? `merchantSellingPrice: ${merchantSellingPrice},` : ''}
    ${queryObj.purchaseDate ? `purchaseDate: "${purchaseDate.toISOString()}",` : ''}
  }){
    id
  }
}
`;

export default updateUserMerchant;
