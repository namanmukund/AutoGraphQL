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
import UserCurrentComponentStatus from './userCurrentComponentStatus';
import UserQuizReport from './userQuizReport';
import UserBookmark from './userBookmark';
import UserProfile from './userProfile';
import UserCourseSyllabus from './userCourseSyllabus';
import UserVideo from './userVideo';
import UserLO from './userLO';
import UserTopicJourney from './userTopicJourney';
import UserPracticeQuestionReport from './userPracticeQuestionReport';

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
  ...UserCurrentComponentStatus,
  ...UserQuizReport,
  ...UserBookmark,
  ...UserProfile,
  ...UserCourseSyllabus,
  ...UserVideo,
  ...UserLO,
  ...UserTopicJourney,
  ...UserPracticeQuestionReport,
];
