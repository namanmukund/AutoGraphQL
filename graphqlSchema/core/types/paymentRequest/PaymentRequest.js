const PaymentRequest = `
  type PaymentRequest {
    txnId: String!,
    hash: String!,
    amount: Int,
    firstName: String!,
    email: String!,
    phone: String!,
    productInfo: String!,
  }
`;

export default PaymentRequest;
