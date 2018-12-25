import User from './user';
import File from './file';
import Collections from './collections';
import AppToken from './appToken';
import BlacklistedToken from './blacklistedToken';
import AppVersion from './appVersion';
import Library from './library';
import Chapter from './chapter';
import Topic from './topic';
import LearningObjective from './learningObjective';
import ConceptCard from './conceptCard';
import Visual from './visual';
import TechnicalQuestion from './technicalQuestion';
import QuestionBank from './questionBank';

export default [
  ...User,
  ...File,
  ...Collections,
  ...AppToken,
  ...BlacklistedToken,
  ...AppVersion,
  ...Library,
  ...Chapter,
  ...Topic,
  ...ConceptCard,
  ...Visual,
  ...TechnicalQuestion,
  ...QuestionBank,
  ...LearningObjective,
];
