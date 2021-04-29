const customQueryString = `
me: User,
getPythonByteCode (pythonCode: String!): PythonByteCode
salesOperationReport (fromDate: Date, toDate: Date, country: Country):  [SalesOperationReport]
temporaryScript :  BooleanResult
sendTransactionalMessage(userId: ID, input: TransactionalMessageInput) : BooleanResult 
getTotalAmountCollected ( input: TotalAmountCollectedInput): TotalAmountCollected
getCheatSheet (input: getCheatSheetInput): CheatSheetData
`;

export default customQueryString;
