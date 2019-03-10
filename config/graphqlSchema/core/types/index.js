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
import UserSyllabus from './userSyllabus';
import UserQuizReport from './userQuizReport';
import UserBookmark from './userBookmark';

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
  ...UserSyllabus,
  ...UserQuizReport,
  ...UserBookmark,
];
