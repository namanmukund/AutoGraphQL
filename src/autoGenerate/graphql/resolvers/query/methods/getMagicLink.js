/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get, pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import { TLA, TMS } from '../../../../../../constants';

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

const fetchUser = async ({ userId, email, number }) => {
  const query = `{
  users(filter: { ${userId ? `id: "${userId}"` : ''} ${email ? `email:"${email}"` : ''} ${number ? `phone_number_subDoc:"${number}"` : ''} }) {
    id
    name
    role
  }
}`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.user');
};

const generateTokenAndReturn = (user, linkType = 'login', appName) => {
  const { userToken, expiresIn, expiryToken } = getUserToken(user, new Date());
  let magicLink = '';
  if (appName === TLA) {
    if (linkType === 'login') {
      magicLink = 'https://www.tekie.in/login?';
      if (process.env.NODE_ENV !== 'production') {
        magicLink = 'https://tekie-web-staging.herokuapp.com/login?';
      }
    } else {
      magicLink = 'https://www.tekie.in/forget-password?';
      if (process.env.NODE_ENV !== 'production') {
        magicLink = 'https://tekie-web-staging.herokuapp.com/forget-password?';
      }
    }
  } else if (appName === TMS) {
    magicLink = 'https://tekie-managment-system.herokuapp.com/forget-password?';
    if (process.env.NODE_ENV !== 'production') {
      magicLink = 'https://tekie-tms-staging.herokuapp.com/forget-password?';
    }
  }
  magicLink += `linkToken=${expiryToken}&userToken=${userToken}`;
  addMagicLinkLogQuery += `addMagicLinkLog1: addMagicLinkLog(
    input: {
      userToken: "${userToken}"
      expiresIn: "${expiresIn}"
      expiryToken: "${expiryToken}"
      isActive: true
      visitedCount: 0
      linkType: ${linkType}
      generatedLink: "${magicLink}"
      appName: ${appName}
    }
    userConnectId: "${get(user, 'id')}"
  ) {
    id
  }`;
  if (addMagicLinkLogQuery) {
    callLocalGraphqlApi(`mutation{ ${addMagicLinkLogQuery} }`);
  }
  return {
    userToken,
    expiryToken,
    expiresIn,
    loginLink,
  };
};

// this API will return magic link uri for auto login
const getMagicLink = (async (root, params, context) => {
  const { input } = params;
  // getting input from params
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
  } = userAndAppInfo;
  const classId = get(input, 'classId');
  const userId = get(input, 'userId');
  const userEmail = get(input, 'email');
  const userPhoneNumber = get(input, 'phone.number');
  const linkType = get(input, 'linkType');
  const tokens = [];
  if (classId) {
    const classStudents = await fetchClassStudent(classId);
    if (classStudents && classStudents.length > 0) {
      let addMagicLinkLogQuery = '';
      classStudents.forEach((student, index) => {
        const { user } = student;
        const { userToken, expiresIn, expiryToken } = getUserToken(user, new Date());
        let loginLink = 'https://www.tekie.in/login?';
        if (process.env.NODE_ENV !== 'production') {
          loginLink = 'https://tekie-web-staging.herokuapp.com/login?';
        }
        loginLink += `linkToken=${expiryToken}&userToken=${userToken}`;
        addMagicLinkLogQuery += `addMagicLinkLog${index}: addMagicLinkLog(
          input: {
            userToken: "${userToken}"
            expiresIn: "${expiresIn}"
            expiryToken: "${expiryToken}"
            isActive: true
            visitedCount: 0
            linkType: login
            generatedLink: "${loginLink}"
            appName: ${appName}
          }
          userConnectId: "${get(user, 'id')}"
        ) {
          id
        }`;
        tokens.push({
          userToken,
          expiryToken,
          expiresIn,
          loginLink,
        });
      });
      if (addMagicLinkLogQuery) {
        callLocalGraphqlApi(`mutation{ ${addMagicLinkLogQuery} }`);
      }
    }
  } else if (userId) {
    const user = await fetchUser({ userId });
    tokens.push({
      ...generateTokenAndReturn(user),
    });
  } else if (userEmail) {
    const user = await fetchUser({ email: userEmail });
    tokens.push({
      ...generateTokenAndReturn(user, linkType, appName),
    });
  } else if (userPhoneNumber) {
    const user = await fetchUser({ number: userPhoneNumber });
    tokens.push({
      ...generateTokenAndReturn(user, linkType, appName),
    });
  }
  return tokens;
});

export default getMagicLink;
