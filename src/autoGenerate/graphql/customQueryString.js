const customQueryString = `
me: User,
getPythonByteCode (pythonCode: String!): PythonByteCode
salesOperationReport (fromDate: Date, toDate: Date):  [SalesOperationReport]
temporaryScript :  BooleanResult
sendTransactionalMessage(userId: ID, input: TransactionalMessageInput) : BooleanResult 
`;

export default customQueryString;
