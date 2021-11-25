const customQueryString = `
me: User,
getPythonByteCode (pythonCode: String!): PythonByteCode
salesOperationReport (fromDate: Date, toDate: Date, country: Country):  [SalesOperationReport]
temporaryScript :  BooleanResult
sendTransactionalMessage(userId: ID, input: TransactionalMessageInput) : BooleanResult 
sendTextMessage(phoneNumber: String!, body: String!) : BooleanResult 
getTotalAmountCollected ( input: TotalAmountCollectedInput): TotalAmountCollected
getCheatSheet (input: getCheatSheetInput): CheatSheetData
getCampaignSlots (input: GetCampaignSlotsInput): GetCampaignSlotsResult
getSchoolDetails (input: GetSchoolDetailsInput): GetSchoolDetailsResult
getStudentCurrentStatus (input: getStudentCurrentStatusInput): StudentCurrentStatus
getCourseCertificate (input: GetCourseCertificateInput ): CourseCertificateResult
getSchoolCampaignSlots (input: GetSchoolCampaignSlotsInput): [GetSchoolCampaignSlotsResult]
getUserCourses (input: GetUserCoursesInput): [GetUserCoursesResults]
getEventCertificate (input: GetEventCertificateInput): GetEventCertificateResult
getMagicLink (input: GetMagicLinkInput): [GetMagicLinkOutput]
`;

export default customQueryString;
