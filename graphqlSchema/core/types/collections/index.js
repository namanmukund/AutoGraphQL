import Enum from './enum';
import Phone from './Phone';
import BooleanResult from './BooleanResult';
import MobileDeviceInformation from './MobileDeviceInformation';
import AggregationResult from './AggregationResult';
import TokenType from './TokenType';
import GroupByAggregationResult from './GroupByAggregationResult';
import QuestionBankOption from './QuestionBankOption';
import QuestionBankAnswer from './QuestionBankAnswer';
import Class from './Class';
import ParentChildSignUpInput from './ParentChildSignUpInput';
import ChildrenToken from './ChildrenToken';
import PythonByteCode from './PythonByteCode';
import SalesOperationReport from './SalesOperationReport';
import TransactionalMessageInput from './TransactionalMessageInput';
import CodingLanguage from './CodingLanguage';
import AddUpdateBulkSchoolUserDataOutput from './AddUpdateBulkSchoolUserDataOutput';
import ErrorLog from './ErrorLog';
import BulletPoint from './BulletPoint';
import WorkbookExample from './WorkbookExample';
import UpdateParentChildDetailInput from './UpdateParentChildDetailInput.js';
import TimestampTag from './TimestampTag';
import ProductFeature from './ProductFeature';
import UrlResult from './UrlResult';
import ScheduleSessionsInput from './ScheduleSessions';
import CodeEditorConfig from './CodeEditorConfig';

export default [
  ...Enum,
  ...Phone,
  BooleanResult,
  PythonByteCode,
  ...MobileDeviceInformation,
  AggregationResult,
  TokenType,
  GroupByAggregationResult,
  ...QuestionBankOption,
  ...QuestionBankAnswer,
  Class,
  ParentChildSignUpInput,
  UpdateParentChildDetailInput,
  ChildrenToken,
  SalesOperationReport,
  TransactionalMessageInput,
  CodingLanguage,
  AddUpdateBulkSchoolUserDataOutput,
  ErrorLog,
  ...BulletPoint,
  ...WorkbookExample,
  ...TimestampTag,
  ...ProductFeature,
  ...UrlResult,
  ...ScheduleSessionsInput,
  ...CodeEditorConfig,
];
