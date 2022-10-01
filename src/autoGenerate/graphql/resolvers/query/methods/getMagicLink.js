/* eslint-disable no-await-in-loop */
/* eslint-disable no-lonely-if */
/* eslint-disable no-param-reassign */
/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import fetch from 'node-fetch';
import moment from 'moment';
import coreAuthParams from '../../../../../../config/authParams';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import getTokenForLoginLink from '../../utils/getTokenForLoginLink';
import {
  TMS, byPassMenteeValidationApps, TBA, newTekieWebLinks,
} from '../../../../../../constants';
import { log } from '../../../../../../utils';
import sendMagicLinkToUser from '../../../../../email/messages/sendMagicLinkToUser';

const getLoginLinkUri = (linkUri, code) => {
  if (process.env.NODE_ENV === 'production') {
    if (code) {
      linkUri = `https://${code}.tekie.in/${linkUri}`;
    } else {
      linkUri = `${process.env.TEKIE_WEB_URL}/login${linkUri}`;
    }
  } else if (process.env.DATA_MASKING) {
    linkUri = `${newTekieWebLinks.preProd}/login${linkUri}`;
  } else {
    linkUri = `${newTekieWebLinks.staging}/login${linkUri}`;
  }
  return linkUri;
};

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
      schoolCampaignCode
    }
    batch {
      course {
        id
        title
      }
    }
    parents {
      user {
        phone{
          number
          countryCode
        }
        email
        savedPassword
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

const updateMagicLinkLog = async (magicLogId, visitedCount) => {
  const updateQuery = `mutation {
  updateMagicLinkLog(id: "${magicLogId}", input: { ${visitedCount ? `visitedCount: ${visitedCount}` : ''} }) {
    id
  }
}`;
  const updateData = await callLocalGraphqlApi(updateQuery);
  return get(updateData, 'data.updateMagicLinkLog');
};

const getMagicLinkLogs = async (userId, linkToken) => {
  const query = `{
  magicLinkLogs(
    filter: {
      and: [
        { user_some: { id: "${userId}" } }
        { createdAt_gte: "${moment().startOf('day').toISOString()}" }
        { createdAt_lte: "${moment().endOf('day').toISOString()}" }
        {
          linkToken_not: "${linkToken}"
        }
      ]
    }
  ) {
    id
    linkVisitLimit
    visitedCount
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  if (get(result, 'data.magicLinkLogs', []).length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const linkLog of get(result, 'data.magicLinkLogs', [])) {
      const { linkVisitLimit, visitedCount } = linkLog;
      if (visitedCount < linkVisitLimit) {
        // eslint-disable-next-line no-await-in-loop
        await updateMagicLinkLog(get(linkLog, 'id'), linkVisitLimit);
        log(`updating link Log with ID: ${get(linkLog, 'id')}`);
      }
    }
  }
};

const generateAndReturnToken = async (user, addMagicLinkLogQuery = '', index, {
  appName, grade, section, userIdFromContext, schoolId, expiresIn, linkVisitLimit, isLeadLogin,
  parents, school, isDownloadExcel,
}) => {
  const linkToken = getTokenForLoginLink(user, new Date(), expiresIn);
  let linkUri = `?authToken=${linkToken}`;
  if (byPassMenteeValidationApps.includes(appName) && isLeadLogin) {
    linkUri = `login${linkUri}&isLeadLogin=${isLeadLogin}`;
  } else {
    if (parents.length && get(parents, '[0].user.email')) {
      if (get(school, 'id') && get(school, 'code')) {
        // if user is of school will send link with school domain
        try {
          const resp = await fetch(`https://${get(school, 'code')}.tekie.in`);
          if (get(resp, 'status') === 200) {
            linkUri = getLoginLinkUri(linkUri, get(school, 'code'));
          } else {
            linkUri = getLoginLinkUri(linkUri);
          }
        } catch (error) {
          // if school domain doesn`t exist will send link with the tekie.in domain
          linkUri = getLoginLinkUri(linkUri);
          log('something went wrong');
        }
      } else {
        // if user doesn`t belong to school, will send link with tekie.in
        linkUri = getLoginLinkUri(linkUri);
      }
    }
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
      ${isDownloadExcel ? 'isDownloadExcel:true' : ''}
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
      linkVisitLimit = 2, isLeadLogin = false, isDownloadExcel = false,
      studentIds,
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
  if (studentIds && studentIds.length) {
    const studentIdsString = studentIds.map((student) => `"${student}"`);
    fetchQueryFilter = `{ id_in: [${studentIdsString}] }`;
  }
  if (!fetchQueryFilter) {
    throw new MissingMandatoryInputInRequestError();
  } else {
    let addMagicLinkLogQuery = '';
    const studentDetails = await fetchUserDetails(fetchQueryFilter);
    if (studentDetails.length > 0) {
      let index = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const studentDetail of studentDetails) {
        if (studentDetail) {
          const {
            user, parents = [], school, batch,
          } = studentDetail;
          const {
            expiresIn: expiryValue, linkToken, linkUri, addMagicLinkLogQuery: addLogQuery,
          // eslint-disable-next-line no-await-in-loop
          } = await generateAndReturnToken(user, '', index, {
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
            isDownloadExcel,
          });
          await getMagicLinkLogs(get(user, 'id'), linkToken);
          if (!byPassMenteeValidationApps.includes(appName)) {
            if (!isDownloadExcel) {
              if (linkUri) {
                if (parents.length && get(parents, '[0].user.email')) {
                  let schoolCampaignCode = '';
                  if (get(school, 'schoolCampaignCode')) {
                    if (process.env.NODE_ENV === 'production') {
                      schoolCampaignCode = `${process.env.TEKIE_WEB_URL}/login?schoolCode=${get(school, 'schoolCampaignCode')}`;
                    } else if (process.env.DATA_MASKING) {
                      schoolCampaignCode = `${newTekieWebLinks.preProd}/login?schoolCode=${get(school, 'schoolCampaignCode')}`;
                    } else {
                      schoolCampaignCode = `${newTekieWebLinks.staging}/login?schoolCode=${get(school, 'schoolCampaignCode')}`;
                    }
                  }
                  const emailMessageObj = {
                    loginLink: linkUri,
                    studentName: get(user, 'name'),
                    schoolName: get(school, 'name'),
                    phone: get(parents, '[0].user.phone.number') ? `${get(parents, '[0].user.phone.countryCode')}${get(parents, '[0].user.phone.number')}` : '',
                    email: get(parents, '[0].user.email') || '',
                    password: get(parents, '[0].user.savedPassword') || '',
                    getStartedLink: schoolCampaignCode,
                    tekieIntoToCodingCourse: get(batch, 'course.title'),
                  };
                  sendMagicLinkToUser(get(parents, '[0].user.email'), emailMessageObj);
                }
              }
            }
          }
          const tokenObj = {
            linkToken,
            expiresIn: expiryValue,
            linkUri,
          };
          if (get(user, 'id')) {
            tokenObj.user = { type: 'User', typeId: `${get(user, 'id')}` };
          }
          if (get(school, 'id')) {
            tokenObj.school = { type: 'School', typeId: `${get(school, 'id')}` };
          }
          tokens.push(tokenObj);
          addMagicLinkLogQuery += addLogQuery;
          index += 1;
        }
      }
      if (addMagicLinkLogQuery) {
        callLocalGraphqlApi(`mutation{ ${addMagicLinkLogQuery} }`);
      }
    }
  }
  return tokens;
});

export default getMagicLink;
