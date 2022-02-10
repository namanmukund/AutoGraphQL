const customQueryString = `
    me: User,
    getPythonByteCode (pythonCode: String!): PythonByteCode
    salesOperationReport (fromDate: Date, toDate: Date, country: Country):  [SalesOperationReport]
    temporaryScript :  BooleanResult
    sendTransactionalMessage(userId: ID, input: TransactionalMessageInput) : BooleanResult 
    sendTextMessage(phoneNumber: String!, body: String!) : BooleanResult
    sendCommsMessage(input: commsInput): BooleanResult
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
    getEventSpeaker (eventId: String): [GetEventSpeaker]
    getEventWinner (eventId: String): [GetEventWinner]
    classroomSessions (filter: ClassroomSessionFilter!): [ClassroomSessionResult]
    classroomDetail (batchId: String): ClassroomDetailResult
`;

export default customQueryString;
