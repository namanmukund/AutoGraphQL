import { pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../config/authParams';

const getTokenForLoginLink = (user, createdAt, expiresIn) => {
  const userInfo = pick(user, ['id', 'username']);
  const linkTokenSecret = coreAuthParams.LINK_TOKEN_SECRET;
  // always taking expire value in hours
  const linkToken = jwt.sign(
    {
      linkData: {
        expiresIn: moment(createdAt).add(expiresIn, 'hours'),
        userInfo,
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
