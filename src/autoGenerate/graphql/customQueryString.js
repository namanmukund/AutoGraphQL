const customQueryString = `
me: User,
getPythonByteCode (pythonCode: String!): PythonByteCode
salesOperationReport (fromDate: Date, toDate: Date):  [SalesOperationReport]
temporaryScript :  BooleanResult
`;

export default customQueryString;
