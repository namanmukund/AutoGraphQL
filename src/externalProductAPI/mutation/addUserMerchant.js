const addUserMerchant = (queryObj) => `
mutation{
  addUserMerchant(input:{
    ${queryObj.parentName ? `parentName: "${queryObj.parentName}",` : ''}
    ${queryObj.phone ? `parentPhone:{
      number: "${queryObj.phone}",
      countryCode:"+91"
    },` : ''}
    ${queryObj.email ? `parentEmail: "${queryObj.email}",` : ''}
    ${queryObj.productId ? `productId:"${queryObj.productId}",` : ''}
    ${queryObj.studentName ? `studentName: "${queryObj.studentName}",` : ''}
    ${queryObj.grade ? `grade: Grade${grade},` : ''}
    ${queryObj.status ? `paymentStatus:${queryObj.status}, ` : ''}
  }){
    id
  }
}
`;

export default addUserMerchant;
