import { QueryController } from '../controllers';
import { randomNumberRangeForUsername } from '../../../../constants';
import { getRandomNumber } from '../../../../utils';


const generateUsername = (input) => {
  const { name } = input;
  // username to always be derived from name
  let username = name.replace(/\s/g, '').toLowerCase();

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
