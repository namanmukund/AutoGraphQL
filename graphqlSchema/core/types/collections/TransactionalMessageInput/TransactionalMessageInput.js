const TransactionalMessageInput = `
  input TransactionalMessageInput {
    messageType: TransactionalMessageType! 
    medium: TransactionalMessageMedium! @defaultValue(value: "all")
    sessionLink: String
}
`;

export default TransactionalMessageInput;
