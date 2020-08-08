import { getHookValidationFunctionName } from '../graphql/preHookFunctions/validation/utils/index';
import * as validationFunctions from '../graphql/preHookFunctions/validation/index';

const addCalledValidationFunctionToContext = (validationFunctionName, context) => {
  /* eslint-disable no-param-reassign */
  context.hookValidationsCalled = context.hookValidationsCalled || [];
  if (!context.hookValidationsCalled.includes(validationFunctionName)) {
    context.hookValidationsCalled.push(validationFunctionName);
  }
  /* eslint-enable no-param-reassign */
};

// allowHookValidationToBeCalledAgain -> when validation func being called in loop
// returns true if validation func already been called and allowHookValidationToBeCalledAgain false
const isHookValidationAlreadyBeenCalled = (hookValidationsCalled,
  validationFunctionName, allowHookValidationToBeCalledAgain) => hookValidationsCalled && hookValidationsCalled.includes(validationFunctionName)
   && !allowHookValidationToBeCalledAgain;

const callAddUpdateHookValidationFunction = (mutationOrQueryName, params,
  context, allowHookValidationToBeCalledAgain) => {
  const validationFunctionName = getHookValidationFunctionName(mutationOrQueryName);
  if (isHookValidationAlreadyBeenCalled(context.hookValidationsCalled, validationFunctionName,
    allowHookValidationToBeCalledAgain)) {
    return null;
  }
  if (typeof validationFunctions[validationFunctionName] === 'function') {
    const fn = validationFunctions[validationFunctionName];
    // add validation called to context
    addCalledValidationFunctionToContext(validationFunctionName, context);
    return fn(params, context);
  }
  return null;
};

/* connect record1 -> type which comes first in relation name
   connect record2 -> type which comes second in relation name  */
const callConnectHookValidationFunction = (mutationOrQueryName, connectRecord1,
  connectRecord2, params, context, allowHookValidationToBeCalledAgain) => {
  const validationFunctionName = getHookValidationFunctionName(mutationOrQueryName);
  if (isHookValidationAlreadyBeenCalled(context.hookValidationsCalled, validationFunctionName,
    allowHookValidationToBeCalledAgain)) {
    return null;
  }
  if (typeof validationFunctions[validationFunctionName] === 'function') {
    const fn = validationFunctions[validationFunctionName];
    // add validation called to context
    addCalledValidationFunctionToContext(validationFunctionName, context);
    return fn(connectRecord1, connectRecord2, context, params);
  }
  return null;
};

export { callAddUpdateHookValidationFunction, callConnectHookValidationFunction };
