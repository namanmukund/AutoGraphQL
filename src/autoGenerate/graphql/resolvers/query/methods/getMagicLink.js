/* eslint-disable no-param-reassign */
/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get, pick } from 'lodash';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';

const getLinkToken = (user, createdAt, expiresIn) => {
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
  appName, grade, section, userIdFromContext, schoolId, expiresIn, linkVisitLimit,
}) => {
  const linkToken = getLinkToken(user, new Date(), expiresIn);
  const linkUri = `/login?authToken=${linkToken}`;
  addMagicLinkLogQuery = `addMagicLinkLog${index}: addMagicLinkLog(
    input: {
      expiresIn: ${expiresIn}
      linkToken: "${linkToken}"
      isLinkVisited: false
      visitedCount: 0
      linkUri: "${linkUri}"
      linkGeneratedFrom: ${appName}
      linkVisitLimit: ${linkVisitLimit}
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
    linkToken,
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
      linkVisitLimit = 2,
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
          expiresIn: expiresInValue, linkToken, linkUri, addMagicLinkLogQuery: addLogQuery,
        } = generateAndReturnToken(user, '', index, {
          appName, grade, section, userIdFromContext, schoolId, expiresIn, linkVisitLimit,
        });
        tokens.push({
          linkToken,
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
