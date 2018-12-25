import { startCase } from 'lodash';

const getUserShortName = (userName) => {
  const nameArray = userName.split(' ');
  if (nameArray.length > 1 && nameArray[0].length < 3) {
    return startCase(`${nameArray[0]} ${nameArray[nameArray.length - 1]}`);
  }
  return startCase(nameArray[0]);
};

export default getUserShortName;
