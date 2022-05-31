/* eslint-disable no-param-reassign */
import { get } from 'lodash';
import { TBA, TMS } from '../../../../constants';
import { MENTEE } from '../../../../constants/roles';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import getFieldsBeingFetched from '../../utils/getFieldsBeingFetched';
import { getUserIdandAppNameAfterValidation, validateTokenAndExtractInformation } from '../preHookFunctions/validation/utils';

const getStudentProfile = async (userId) => {
  const query = `{
  studentProfiles(filter: { user_some: { id: "${userId}" } }) {
    id
  }
}
`;
  const result = await callLocalGraphqlApi(query);
  return get(result, 'data.studentProfiles[0].id');
};

const validateIncomingFields = async (fieldsFetched = {}) => {
  const fieldsFetchedArr = Object.keys(fieldsFetched);
  let isValid = true;
  if (fieldsFetchedArr && fieldsFetchedArr.length) {
    fieldsFetchedArr.forEach((field) => {
      if (field === 'registeredUsers') isValid = false;
    });
  }
  return isValid;
};

const fetchEventPostHookMethod = async (input, params, mutationName, context, info) => {
  const { fieldNodes } = info;
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const {
    userIdFromContext,
    appName,
  } = userAndAppInfo;
  if (appName === TMS || appName === TBA) return input;
  const userInfo = validateTokenAndExtractInformation(context, true);
  const {
    currentUser,
  } = userInfo;
  const userRoleFromContext = currentUser && currentUser.role;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  const isValidField = await validateIncomingFields(fieldsFetched);
  if (!isValidField) {
    if (!userIdFromContext) {
      if (Array.isArray(input) && input.length) {
        input.forEach((elem) => {
          elem.registeredUsers = [];
        });
      } else {
        input.registeredUsers = [];
      }
    }
    if (userIdFromContext && userRoleFromContext === MENTEE) {
      const studentProfileId = await getStudentProfile(userIdFromContext);
      if (Array.isArray(input) && input.length) {
        input.forEach((elem) => {
          elem.registeredUsers = get(elem, 'registeredUsers', []).filter((user) => get(user, 'typeId') === studentProfileId);
        });
      } else {
        input.registeredUsers = get(input, 'registeredUsers', []).filter((user) => get(user, 'typeId') === studentProfileId);
      }
    }
  }
  return input;
};

export default fetchEventPostHookMethod;
