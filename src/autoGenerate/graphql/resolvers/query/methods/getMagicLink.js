/* eslint-disable no-param-reassign */
/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import fetch from 'node-fetch';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import getTokenForLoginLink from '../../utils/getTokenForLoginLink';
import { TMS, byPassMenteeValidationApps, TBA } from '../../../../../../constants';
import { log } from '../../../../../../utils';

const fetchUserDetails = async (queryFilter) => {
  const query = `{
  studentProfiles(
    filter: {
      and: [${queryFilter}]
    }
  ) {
    id
    school {
      id
      name
      code
    }
    parents {
      user {
        email
      }
    }
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
  appName, grade, section, userIdFromContext, schoolId, expiresIn, linkVisitLimit, isLeadLogin,
  parents, school,
}) => {
  const linkToken = getTokenForLoginLink(user, new Date(), expiresIn);
  let linkUri = `?authToken=${linkToken}`;
  if (!byPassMenteeValidationApps.includes(appName)) {
    if (parents.length && get(parents, '[0].user.email')) {
      if (get(school, 'code')) {
        fetch(`https://${get(school, 'code')}.tekie.in`).then((res) => {
          if (get(res, 'status') === 200) {
            linkUri = `https://${get(school, 'code')}.tekie.in/${linkToken}`;
          }
        }).catch((err) => log('something went wrong'));
      } else {
        linkUri = `https://${process.env.TEKIE_WEB_URL}/login${linkUri}`;
      }
    }
  } else if (byPassMenteeValidationApps.includes(appName) && isLeadLogin) {
    linkUri = `login${linkUri}&isLeadLogin=${isLeadLogin}`;
  }
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
      ${isLeadLogin ? 'isLeadLogin: true' : ''}
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
      schoolId, grade, section, userId, email, phone, expiresIn,
      linkVisitLimit = 2, isLeadLogin = false,
    },
  } = params;
  // getting input from params
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context);
  const {
    appName,
    userIdFromContext,
  } = userAndAppInfo;
  const tokens = [];
  let expiresInValue = expiresIn;
  if (!expiresIn) {
    if (appName === TMS || appName === TBA) expiresInValue = coreAuthParams.DEFAULT_EXPIRY_TOKEN_TIME_IN_HOUR;
    else expiresInValue = coreAuthParams.DEFAULT_EXPIRY_TOKEN_TIME_IN_HOUR_FOR_WEB;
  }
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
        const { user, parents = [], school } = student;
        const {
          expiresIn: expiryValue, linkToken, linkUri, addMagicLinkLogQuery: addLogQuery,
        } = generateAndReturnToken(user, '', index, {
          appName,
          grade,
          section,
          userIdFromContext,
          schoolId,
          expiresIn: expiresInValue,
          linkVisitLimit,
          isLeadLogin,
          parents,
          school,
        });
        if (!byPassMenteeValidationApps.includes(appName)) {
          if (parents.length && get(parents, '[0].user.email')) {
            if (linkUri) {
              console.log(linkUri);
            }
          }
        }
        tokens.push({
          linkToken,
          expiresIn: expiryValue,
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
