const updateUserMerchant = (userMerchantId, input) => `
mutation{
  updateUserMerchant(
    id: "${userMerchantId}"
    input:${input}){
    id
  }
}
`;

export default updateUserMerchant;
