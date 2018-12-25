/* eslint-disable no-await-in-loop */
/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import { QueryController } from '../controllers';
import { userProfiles } from '../../../../constants';
import { deleteUserMutation } from '../../../api/queries/user';
import callGraphqlApi from '../../../api/callGraphqlApi';

const removeUserIfNoMultipleProfiles = (userId, currentProfile) => {
  const newAuthentication = {
    bypass: true,
  };
  const modelQuery = new QueryController('User', newAuthentication);
  // db call so that just in one query i can get all the profile info
  return modelQuery.fetchById(userId).then(async (res) => {
    const userProfilesForValidation = [];
    userProfiles.forEach((profile) => {
      if (profile !== currentProfile) {
        userProfilesForValidation.push(profile);
      }
    });
    let shouldRemoveUser = true;
    // if any profile other than current profile exist then remove the user
    for (const userProfile of userProfilesForValidation) {
      if (res && res[userProfile] && res[userProfile].typeId) {
        shouldRemoveUser = false;
        break;
      }
    }
    if (shouldRemoveUser) {
      // graphql call so that everything related to user can get deleted
      await callGraphqlApi(deleteUserMutation(userId));
    }
    return null;
  });
};

export default removeUserIfNoMultipleProfiles;
