import User from './user';
import File from './file';
import Collections from './collections';
import AppToken from './appToken';
import BlacklistedToken from './blacklistedToken';
import AppVersion from './appVersion';
import Chapter from './chapter';
import Topic from './topic';
import LearningObjective from './learningObjective';
import QuestionBank from './questionBank';
import Message from './message';
import Course from './course';
import UserActivityVideoDump from './userActivityVideoDump';
import UserActivityChatDump from './userActivityChatDump';
import UserActivityPQDump from './userActivityPQDump';
import UserActivityQuizDump from './userActivityQuizDump';
import UserCurrentTopicComponentStatus from './userCurrentTopicComponentStatus';
import UserQuiz from './userQuiz';
import UserQuizReport from './userQuizReport';
import UserBookmark from './userBookmark';
import UserProfile from './userProfile';
import UserCourseSyllabus from './userCourseSyllabus';
import UserVideo from './userVideo';
import UserLearningObjective from './userLearningObjective';
import UserTopicJourney from './userTopicJourney';
import UserPracticeQuestionReport from './userPracticeQuestionReport';
import Badge from './badge';
import UserFirstAndLatestQuizReport from './userFirstAndLatestQuizReport';
import SkipVideo from './skipVideo';
import UserBadge from './userBadge';
import QuizReport from './quizReport';
import StickerEmoji from './stickerEmoji';
import StudentProfile from './studentProfile';
import ParentProfile from './parentProfile';
import School from './school';
import AssignmentQuestion from './assignmentQuestion';
import UserAssignment from './userAssignment';
import UserActivityAssignmentDump from './userActivityAssignmentDump';
import MentorSession from './mentorSession';
import MenteeSession from './menteeSession';
import AvailableSlot from './availableSlot';
import MentorMenteeSession from './mentorMenteeSession';
import MenteeCourseSyllabus from './menteeCourseSyllabus';
import Discount from './discount';
import UserPayment from './userPayment';
import Product from './product';
import PaymentRequest from './paymentRequest';
import UserCredit from './userCredit';
import InviteUser from './userInvite';
import SalesOperation from './salesOperation';
import UserCreditLog from './userCreditLog';
import SalesOperationLog from './salesOperationLog';
import NetPromoterScore from './netPromoterScore';
import SalesOperationActivity from './salesOperationActivity';
import UserPaymentPlan from './userPaymentPlan';
import UserPaymentInstallment from './userPaymentInstallment';
import UserPaymentLink from './userPaymentLink';
import UserBankDetail from './userBankDetail';
import MarketingResource from './marketingResource';
import ScheduleJob from './scheduleJob';
import MentorProfile from './mentorProfile';
import TotalAmountCollected from './totalAmountCollected';
import UserSavedCode from './userSavedCode';
import SalesExecutiveProfile from './salesExecutiveProfile';
import MentorPricing from './mentorPricing';
import MentorReport from './mentorReport';
import Batch from './batch';
import BatchCurrentComponentStatus from './batchCurrentComponentStatus';
import BatchSession from './batchSession';
import AdhocSession from './adhocSession';
import UserLocationLog from './userLocationLog';
import MentorMenteeSessionAudit from './mentorMenteeSessionAudit';
import MentorMenteeSessionTimestamp from './mentorMenteeSessionTimestamp';
import UserApprovedCode from './userApprovedCode';
import UserApprovedCodeReactionLog from './userApprovedCodeReactionLog';
import UserApprovedCodeTag from './userApprovedCodeTag';
import UserApprovedCodeTagMapping from './userApprovedCodeTagMapping';
import Banner from './banner';
import CheatSheet from './cheatSheet';
import CheatSheetContent from './cheatSheetContent';
import ContentTag from './contentTag';
import Workbook from './workbook';
import Project from './project';
import ProjectContent from './projectContent';
import Testimonial from './testimonial';
import CheatSheetData from './cheatSheetData';
import UserCheatSheet from './userCheatSheet';
import NewsFeed from './newsFeed';
import SchoolClass from './schoolClass';
import Campaign from './campaign';
import BulkMentorSessionInput from './bulkMentorSessionInput';
import RescheduledSlot from './rescheduledSlot';
import GetCampaignSlots from './getCampaignSlots';
import GetSchoolDetails from './getSchoolDetails';
import BookB2B2CSlotsInput from './bookB2B2CSlotsInput';
import StudentCurrentStatus from './studentCurrentStatus';
import Video from './video';
import ComicStrip from './comicStrip';
import BlockBasedProject from './blockBasedProject';
import UserActivityBlockBasedPracticeDump from './userActivityBlockBasedPracticeDump';
import UserActivityComicStripDump from './userActivityComicStripDump';
import UserBlockBasedPractice from './userBlockBasedPractice';
import UserBlockBasedProject from './userBlockBasedProject';
import UserActivityBlockBasedProjectDump from './userActivityBlockBasedProjectDump';
import ComicImage from './comicImage';
import UserCourseCompletion from './userCourseCompletion';
import GetCourseCertificate from './getCourseCertificate';
import SessionLog from './sessionLog';
import SessionReport from './sessionReport';
import RebookMenteeSessionInput from './rebookMenteeSessionInput';
import sendJourneySnapshotInMailInput from './sendJourneySnapshotInMailInput';
import sendCertificateInMailInput from './sendCertificateInMailInput';
import GenerateCertificate from './generateCertificate';
import TopicQuestions from './topicQuestions';
import TopicAssignmentQuestion from './topicAssignmentQuestion';
import AuditQuestion from './auditQuestion';
import PreSalesAudit from './preSalesAudit';
import PostSalesAudit from './postSalesAudit';
import AuditQuestionSection from './auditQuestionSection';
import AuditQuestionSubSection from './auditQuestionSubSection';
import GetSchoolCampaignSlots from './getSchoolCampaignSlots';
import BDEProfile from './bdeProfile';
import UserCourse from './userCourse';
import GetUserCourses from './getUserCourses';
import UserMerchant from './userMerchant';
import MentorSupplyPaySlab from './mentorSupplyPaySlab';
import MentorDemandSlot from './mentorDemandSlot';
import MentorAvailabilitySlot from './mentorAvailabilitySlot';
import MentorAuditReport from './mentorAuditReport';
import ShiftBatchSessionsInput from './shiftBatchSessionsInput';
import EventCertificate from './eventCertificate';
import QuestionBankImage from './questionBankImage';
import SessionGradeReport from './sessionGradeReport';
import AcceptedSlotRequestByMentorLog from './acceptedSlotRequestByMentorLog';
import SessionCourseReport from './sessionCourseReport';
import GetEventCertificate from './getEventCertificate';
import Event from './event';
import UtmDetail from './utmDetail';
import IqaReport from './iqaReport';
import getMagicLink from './getMagicLink';
import magicLinkLog from './magicLinkLog';
import LeadPartner from './leadPartner';
import DemoWowAudit from './demoWowAudits';

export default [
  ...User,
  ...File,
  ...Collections,
  ...AppToken,
  ...BlacklistedToken,
  ...AppVersion,
  ...Chapter,
  ...Topic,
  ...QuestionBank,
  ...LearningObjective,
  ...Message,
  ...Course,
  ...UserActivityVideoDump,
  ...UserActivityChatDump,
  ...UserActivityPQDump,
  ...UserActivityQuizDump,
  ...UserCurrentTopicComponentStatus,
  ...UserQuiz,
  ...UserBookmark,
  ...UserProfile,
  ...UserCourseSyllabus,
  ...UserVideo,
  ...UserLearningObjective,
  ...UserTopicJourney,
  ...UserPracticeQuestionReport,
  ...UserQuizReport,
  ...Badge,
  ...UserFirstAndLatestQuizReport,
  ...SkipVideo,
  ...UserBadge,
  ...QuizReport,
  ...StickerEmoji,
  ...StudentProfile,
  ...ParentProfile,
  ...School,
  ...AssignmentQuestion,
  ...UserAssignment,
  ...UserActivityAssignmentDump,
  ...MentorSession,
  ...MenteeSession,
  ...AvailableSlot,
  ...MentorMenteeSession,
  ...MenteeCourseSyllabus,
  ...Discount,
  ...UserPayment,
  ...Product,
  ...PaymentRequest,
  ...UserCredit,
  ...InviteUser,
  ...SalesOperation,
  ...UserCreditLog,
  ...SalesOperationLog,
  ...NetPromoterScore,
  ...SalesOperationActivity,
  ...UserPaymentPlan,
  ...UserPaymentInstallment,
  ...UserPaymentLink,
  ...UserBankDetail,
  ...MarketingResource,
  ...ScheduleJob,
  ...MentorProfile,
  ...TotalAmountCollected,
  ...UserSavedCode,
  ...SalesExecutiveProfile,
  ...MentorPricing,
  ...MentorReport,
  ...Batch,
  ...BatchCurrentComponentStatus,
  ...BatchSession,
  ...AdhocSession,
  ...UserLocationLog,
  ...MentorMenteeSessionAudit,
  ...MentorMenteeSessionTimestamp,
  ...UserApprovedCode,
  ...UserApprovedCodeReactionLog,
  ...UserApprovedCodeTag,
  ...UserApprovedCodeTagMapping,
  ...Banner,
  ...CheatSheet,
  ...CheatSheetContent,
  ...ContentTag,
  ...Workbook,
  ...Project,
  ...ProjectContent,
  ...Testimonial,
  ...CheatSheetData,
  ...UserCheatSheet,
  ...NewsFeed,
  ...SchoolClass,
  ...Campaign,
  ...BulkMentorSessionInput,
  ...RescheduledSlot,
  ...GetCampaignSlots,
  ...BookB2B2CSlotsInput,
  ...StudentCurrentStatus,
  ...Video,
  ...ComicStrip,
  ...BlockBasedProject,
  ...UserActivityComicStripDump,
  ...UserActivityBlockBasedPracticeDump,
  ...UserBlockBasedPractice,
  ...UserActivityBlockBasedProjectDump,
  ...UserBlockBasedProject,
  ...ComicImage,
  ...UserCourseCompletion,
  ...GetCourseCertificate,
  ...GetSchoolDetails,
  ...SessionLog,
  ...SessionReport,
  ...RebookMenteeSessionInput,
  ...TopicQuestions,
  ...TopicAssignmentQuestion,
  ...AuditQuestion,
  ...PreSalesAudit,
  ...PostSalesAudit,
  ...AuditQuestionSection,
  ...AuditQuestionSubSection,
  ...GetSchoolCampaignSlots,
  ...BDEProfile,
  ...GetUserCourses,
  ...UserCourse,
  ...UserMerchant,
  ...MentorSupplyPaySlab,
  ...MentorDemandSlot,
  ...MentorAvailabilitySlot,
  ...MentorAuditReport,
  ...ShiftBatchSessionsInput,
  ...sendJourneySnapshotInMailInput,
  ...sendCertificateInMailInput,
  ...GenerateCertificate,
  ...EventCertificate,
  ...QuestionBankImage,
  ...SessionGradeReport,
  ...AcceptedSlotRequestByMentorLog,
  ...SessionCourseReport,
  ...GetEventCertificate,
  ...Event,
  ...UtmDetail,
  ...IqaReport,
  ...getMagicLink,
  ...magicLinkLog,
  ...LeadPartner,
  ...DemoWowAudit,
];
