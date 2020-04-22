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
];
