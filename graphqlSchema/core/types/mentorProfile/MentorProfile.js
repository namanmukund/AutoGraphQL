const ScheduleManagement = `
 type ScheduleManagement {
    isSchedulingLearningClass: Boolean @defaultValue(value: "false")
    isSchedulingAdhocClass: Boolean @defaultValue(value: "false")
    isReschedulingClasses: Boolean @defaultValue(value: "false")
    isSchedulingTestClass: Boolean @defaultValue(value: "false")
    isDeleteSessions: Boolean @defaultValue(value: "false")
 }
`;

const ClassroomControl = `
 type ClassroomControl {
    isCreatingClass: Boolean @defaultValue(value: "false")
    isSendingNotice: Boolean @defaultValue(value: "false")
    shouldAddOrInviteStudent: Boolean @defaultValue(value: "false")
    isAccessRecording: Boolean @defaultValue(value: "false")
    isAccessLiveSessionProgress: Boolean @defaultValue(value: "false")
 }
`;
const CourseControl = `
 type CourseControl {
    shouldAccessCourse: Boolean @defaultValue(value: "false")
    shouldCreateTest: Boolean @defaultValue(value: "false")
    shouldEvaluateTest: Boolean @defaultValue(value: "false")
    shouldAddToQuestionBank: Boolean @defaultValue(value: "false")
 }
`;
const SessionReporting = `
 type SessionReporting {
    shouldAccessReports: Boolean @defaultValue(value: "false")
    shouldDownloadReports: Boolean @defaultValue(value: "false")
    shouldShareReports: Boolean @defaultValue(value: "false")
 }
`;

const MentorProfile = `
  type MentorProfile @model {
    user: User! @relation(name: "MentorProfileUser")
    description: String
    codingLanguages: [CodingLanguage]
    experienceYear: Int
    sessionLink: String
    googleMeetLink: String
    meetingId: String
    meetingPassword: String
    pythonCourseRating5: Int
    pythonCourseRating4: Int
    pythonCourseRating3: Int
    pythonCourseRating2: Int
    pythonCourseRating1: Int
    salesExecutive: SalesExecutiveProfile @relation(name: "SalesExecutiveProfileMentorProfile")
    status: MentorStatus @defaultValue(value: "onboarded")
    isMentorActive: Boolean @defaultValue(value: "true")
    gitHubLink: String
    linkedInLink: String
    portfolioLink: String
    senseiProfile: SenseiProfile @relation(name: "SenseiProfileMentorProfile")
    studentProfile: StudentProfile @relation(name: "MentorStudentProfile")
    school: School @relation(name: "MentorProfileSchool")
    scheduleManagement: ScheduleManagement
    classroomControl: ClassroomControl
    courseControl: CourseControl
    sessionReporting: SessionReporting
}`;

export default [MentorProfile, ScheduleManagement, ClassroomControl, CourseControl, SessionReporting];
