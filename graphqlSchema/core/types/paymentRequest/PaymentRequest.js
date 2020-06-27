const PaymentRequest = `
  type PaymentRequest {
    txnId: String!,
    hash: String!,
    amount: Float,
    firstName: String!,
    email: String!,
    phone: Phone!,
    countryCode: String,
    phoneNumber: String,
    parentName: String,
    productInfo: String!,
    discount: Float,
  }
`;

export default PaymentRequest;
