/* eslint-disable no-param-reassign */
/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get, pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import { TLA, TMS } from '../../../../../../constants';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getUserToken = (user, createdAt, expiresIn) => {
  const userInfo = pick(user, ['id', 'username']);
  const userTokenSecret = coreAuthParams.USER_TOKEN_SECRET;
  const expiryTokenSecret = coreAuthParams.EXPIRY_TOKEN_SECRET;
  const userToken = jwt.sign(
    {
      userInfo,
    },
    userTokenSecret,
    {
      expiresIn: `${expiresIn}h`,
      algorithm: coreAuthParams.ALGORITHM,
    },
  );
  // always taking expire value in hours
  const expiryToken = jwt.sign(
    {
      expiryData: {
        expiresIn: moment(createdAt).add(expiresIn, 'hours'),
      },
    },
    expiryTokenSecret,
    {
      expiresIn: `${expiresIn}h`,
      algorithm: coreAuthParams.ALGORITHM,
    },
  );
  return { userToken, expiryToken };
};

const fetchUserDetails = async (queryFilter) => {
  const query = `{
  studentProfiles(
    filter: {
      and: [${queryFilter}]
    }
  ) {
    id
    user {
      id
      name
      role
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.studentProfiles', []);
};

const generateAndReturnToken = (user, addMagicLinkLogQuery = '', index, {
  appName, grade, section, userIdFromContext, schoolId, expiresIn,
}) => {
  const { userToken, expiryToken } = getUserToken(user, new Date(), expiresIn);
  let linkUri = 'https://www.tekie.in/login?';
  if (process.env.NODE_ENV !== 'production') {
    linkUri = 'https://tekie-web-staging.herokuapp.com/login?';
  }
  linkUri += `linkToken=${expiryToken}&userToken=${userToken}`;
  addMagicLinkLogQuery = `addMagicLinkLog${index}: addMagicLinkLog(
    input: {
      userToken: "${userToken}"
      expiresIn: ${expiresIn}
      expiryToken: "${expiryToken}"
      isLinkVisited: false
      visitedCount: 0
      linkUri: "${linkUri}"
      linkGeneratedFrom: ${appName}
      ${grade ? `grade: ${grade}` : ''}
      ${section ? `section:${section}` : ''}
    }
    userConnectId: "${get(user, 'id')}"
    ${schoolId ? `schoolConnectId:"${schoolId}"` : ''}
    ${userIdFromContext ? `linkGeneratedbyConnectId: "${userIdFromContext}"` : ''}
  ) {
    id
  }`;
  return {
    userToken,
    expiryToken,
    expiresIn,
    linkUri,
    addMagicLinkLogQuery,
  };
};

// this API will return magic link uri for auto login
const getMagicLink = (async (root, params, context) => {
  const {
    input: {
      schoolId, grade, section, userId, email, phone, expiresIn = coreAuthParams.DEFAULT_EXPIRY_TOKEN_TIME_IN_HOUR,
    },
  } = params;
  // getting input from params
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
    userIdFromContext,
  } = userAndAppInfo;
  const tokens = [];
  let fetchQueryFilter = '';
  if (schoolId || grade || section) {
    if (schoolId) fetchQueryFilter += `{ school_some: { id: "${schoolId}" } }`;
    if (grade) fetchQueryFilter += `{ grade: ${grade} }`;
    if (section) fetchQueryFilter += `{ section: ${section} }`;
  } else if (userId) fetchQueryFilter = `{ user_some: { id: "${userId}" } }`;
  else if (email || phone) {
    if (email) {
      fetchQueryFilter = `{
          user_some: {
            parentProfile_some: {
              user_some: { or: [{ email: "${email.trim()}" }, { email: "${email.trim().toLowerCase()}" }] }
            }
          }
        }`;
    }
    if (phone) {
      fetchQueryFilter += `{
          user_some: {
            parentProfile_some: { user_some: { phone_number_subDoc: "${phone}" } }
          }
        }`;
    }
  }
  if (!fetchQueryFilter) {
    throw new MissingMandatoryInputInRequestError();
  } else {
    let addMagicLinkLogQuery = '';
    const studentDetails = await fetchUserDetails(fetchQueryFilter);
    if (studentDetails.length > 0) {
      studentDetails.forEach((student, index) => {
        const { user } = student;
        const {
          userToken, expiresIn: expiresInValue, expiryToken, linkUri, addMagicLinkLogQuery: addLogQuery,
        } = generateAndReturnToken(user, '', index, {
          appName, grade, section, userIdFromContext, schoolId, expiresIn,
        });
        tokens.push({
          userToken,
          expiryToken,
          expiresIn: expiresInValue,
          linkUri,
        });
        addMagicLinkLogQuery += addLogQuery;
      });
      if (addMagicLinkLogQuery) {
        callLocalGraphqlApi(`mutation{ ${addMagicLinkLogQuery} }`);
      }
    }
  }
  return tokens;
});

export default getMagicLink;
