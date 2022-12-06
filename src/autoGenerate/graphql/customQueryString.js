const customQueries = `
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
    getNextOrPrevClassroomSessions (input: [NextOrPrevClassroomSessionInput]!): [NextOrPrevClassroomSessionResult]
    getClassroomDetails (batchIds: [String]): [ClassroomDetailResult]
    getSchoolAndBatchDetail (schoolId: String, batchId: String): BatchAndSchoolResult
    getBatchDetails(otp: Int, schoolCode: String): BatchDetailsResult
    getBatchStudent(batchId: ID, studentRoll: String): [BatchStudentResult]
    getSessionComponentMeta (sessionId: ID!): SessionComponentMetaResult
    getClassroomReport (batchId: String, topicId: String, isHomework: Boolean): ClassroomHomeworkReportOutput
    getPracticeQuestionReport (batchId: String, topicId: String, learningObjectiveId: String, learningSlideId: String, learningObjectiveComponent: String, userId: String): PracticeQuestionReportOutput
    getBuddyStatus (sessionId: ID!, userId: ID, systemId: String, action: String, password: String, studentIds: [ID]): BooleanResult
    getSubmittedAssignmentsStudents (userIds: [ID], topicId: String, courseId: String, type: String): SubmittedAssignmentsOutput   
`;

const cacheCustomQueries = `
    cacheKeys (pattern: String!): CacheKeyResult
    getCache (key: String!): String
    purgeCache (pattern: String): BooleanResult
`;

const googleApisCustomQueries = `
    createGsuiteFileOrFolder(name: String!, mimeType: String!, parentFolderIDs: String): GSuiteResponse
    updatePermissionOfGsuiteFileOrFolder(id: String!, permission: GsuitePermissionInput): GSuiteResponse
    updateParentFolderOfGsuiteFileOrFolder(childId: String!, parentFolderIDs: String!): GSuiteResponse
    duplicateGsuiteFileOrFolder(id: String!, name: String, parentFolderIDs: String): GSuiteResponse
    deleteGsuiteFileOrFolder(id: String!): BooleanResult
    gettingGsuiteChildFileOrFolder(id: String!): [GSuiteResponse]
    getGsuiteFileOrFolderDetails(id: String!): GSuiteResponse
    createGsuiteLastRevisionFile(gsuiteTempleteUrlOrFile: String, gsuiteFileType: String, studentFileCreationName: String, schoolName: String, classroomTitle: String): GSuiteResponse
`;

const customQueryString = customQueries + cacheCustomQueries + googleApisCustomQueries;

export default customQueryString;
