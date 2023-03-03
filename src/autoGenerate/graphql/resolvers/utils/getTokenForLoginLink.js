import { pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../config/authParams';

const getTokenForLoginLink = (users, createdAt, expiresIn) => {
  const usersInfo = (users && users.length > 1) ? users.map((user) => pick(user, ['id', 'username'])) : pick(users, ['id', 'username']);
  const linkTokenSecret = coreAuthParams.LINK_TOKEN_SECRET;
  // always taking expire value in hours
  const linkToken = jwt.sign(
    {
      linkData: {
        expiresIn: moment(createdAt).add(expiresIn, 'hours'),
        usersInfo,
        createdAt: new Date(createdAt),
      },
    },
    linkTokenSecret,
    {
      expiresIn: `${expiresIn}h`,
      algorithm: coreAuthParams.ALGORITHM,
    },
  );
  return linkToken;
};

export default getTokenForLoginLink;
