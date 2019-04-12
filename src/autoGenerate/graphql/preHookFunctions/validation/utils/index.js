import getFinalConnectedRecordsForARelationFromInput
  from './getFinalConnectedRecordsForARelationFromInput';
import getHookValidationFunctionName from '../../../../utils/getHookValidationFunctionName';
import { callAddUpdateHookValidationFunction, callConnectHookValidationFunction } from '../../../../utils/callHookValidationFunction';
import commonUserValidation from './commonUserValidation';
import checkDeleteStatusOfALearningObjective from './checkDeleteStatusOfALearningObjective';
import checkDeleteStatusOfATopic from './checkDeleteStatusOfATopic';
import getLearningObjectiveAndTopicForValidation from './getLearningObjectiveAndTopicForValidation';
import getTopicForValidation from './getTopicForValidation';
import isComponentUnlocked from './isComponentUnlocked';

export {
  getFinalConnectedRecordsForARelationFromInput,
  getHookValidationFunctionName,
  callAddUpdateHookValidationFunction,
  callConnectHookValidationFunction,
  commonUserValidation,
  checkDeleteStatusOfALearningObjective,
  checkDeleteStatusOfATopic,
  getLearningObjectiveAndTopicForValidation,
  getTopicForValidation,
  isComponentUnlocked,
};
