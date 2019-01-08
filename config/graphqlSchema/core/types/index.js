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
import Episode from './episode';
import TechTalk from './techTalk';

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
  ...Episode,
  ...TechTalk,
];
