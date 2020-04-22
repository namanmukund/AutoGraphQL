import { QueryController } from '../controllers';
import { randomNumberRangeForUsername, TLA } from '../../../../constants';
import { getRandomNumber } from '../../../../utils';
import getUserIdandAppNameAfterValidation
  from '../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';


const generateUsername = (input, context) => {
  // calling method to get app name, we will use app name to determine how username will generate
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    appName,
  } = userAndAppInfo;
  const { name, email } = input;
  // username to always be derived from name or email
  // if call is from tekieLearningApp we will use email to generate username
  let username;
  if (appName === TLA) {
    username = email.replace(/\s/g, '').toLowerCase();
  } else {
    username = name.replace(/\s/g, '').toLowerCase();
  }

  const typeName = 'User';
  const newAuthentication = {
    bypass: true,
  };

  const modelQueries = new QueryController(typeName, newAuthentication);
  return modelQueries.fetchOne({ username })
    .then((res) => {
      if (res) {
        /* if user already exist with the given username then
        append a random number at the end of the given username
        */

        username += getRandomNumber(randomNumberRangeForUsername.min,
          randomNumberRangeForUsername.max);
      }
      return username;
    });
};


export default generateUsername;
