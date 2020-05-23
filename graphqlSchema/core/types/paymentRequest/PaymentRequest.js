const PaymentRequest = `
  type PaymentRequest {
    txnId: String!,
    hash: String!,
    amount: Float,
    firstName: String!,
    email: String!,
    phone: Phone!,
    productInfo: String!,
  }
`;

export default PaymentRequest;
