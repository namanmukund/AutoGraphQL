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

export default [
  ...Enum,
  ...Phone,
  BooleanResult,
  ...MobileDeviceInformation,
  AggregationResult,
  TokenType,
  GroupByAggregationResult,
  ...QuestionBankOption,
  ...QuestionBankAnswer,
  Class,
  ParentChildSignUpInput,
  ChildrenToken,
];
