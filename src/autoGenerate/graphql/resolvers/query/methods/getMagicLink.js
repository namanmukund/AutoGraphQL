/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get, pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchClassStudent = async (classId) => {
  const query = `{
  schoolClass(id: "${classId}") {
    id
    students {
      id
      parents {
        id
        user {
          id
          phone {
            number
            countryCode
          }
        }
      }
      user {
        id
        name
        role
      }
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.schoolClass.students', []);
};

const getUserToken = (user, createdAt) => {
  const expiresIn = coreAuthParams.EXPIRY_FOR_MAGIC_TOKEN;
  const userInfo = pick(user, ['id', 'username']);
  const secret = coreAuthParams.SECRET;
  const userToken = jwt.sign(
    {
      userInfo,
    },
    secret,
    {
      expiresIn,
      algorithm: coreAuthParams.ALGORITHM,
    },
  );
  const expiryToken = jwt.sign(
    {
      expiryData: {
        expiresIn: moment(createdAt).add(1, 'day'),
      },
    },
    secret,
    {
      expiresIn,
      algorithm: coreAuthParams.ALGORITHM,
    },
  );
  return { userToken, expiryToken, expiresIn };
};

// this API will return magic link uri for auto login
const getMagicLink = (async (root, params, context) => {
  const { input } = params;
  // getting input from params
  const classId = get(input, 'classId');
  if (classId) {
    const classStudents = await fetchClassStudent(classId);
    const tokens = [];
    if (classStudents && classStudents.length > 0) {
      classStudents.forEach((student) => {
        const { user } = student;
        const { userToken, expiresIn, expiryToken } = getUserToken(user, new Date());
        let loginLink = 'https://www.tekie.in/login?';
        if (process.env.NODE_ENV !== 'production') {
          loginLink = 'https://tekie-web-staging.herokuapp.com/login?';
        }
        loginLink += `linkToken=${expiryToken}&userToken=${userToken}`;
        tokens.push({
          userToken,
          expiryToken,
          expiresIn,
          loginLink,
        });
      });
    }
    return tokens;
  }
  return [];
});

export default getMagicLink;
