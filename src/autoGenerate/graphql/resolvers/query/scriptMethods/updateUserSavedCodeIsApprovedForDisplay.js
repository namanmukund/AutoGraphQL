import { get } from 'lodash';
import { QueryController, MutationController } from '../../../controllers';
import { userSavedCodeStatus } from '../../../../../../constants';

const updateUserSavedCodeIsApprovedForDisplay = async () => {
  const userSavedCodesQuery = new QueryController('UserSavedCode', { bypass: true });
  const userSavedCodesMutation = new MutationController('UserSavedCode', { bypass: true });
  const userSavedCodes = await userSavedCodesQuery.fetchMultiple({});
  // eslint-disable-next-line no-restricted-syntax
  for (const userSavedCode of userSavedCodes) {
    if (get(userSavedCode, 'isApprovedForDisplay') === 'true'
        || get(userSavedCode, 'isApprovedForDisplay') === true
        || get(userSavedCode, 'isApprovedForDisplay') === userSavedCodeStatus.accepted) {
      // eslint-disable-next-line no-await-in-loop
      await userSavedCodesMutation.updateDocument(get(userSavedCode, 'id'), { isApprovedForDisplay: userSavedCodeStatus.accepted });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await userSavedCodesMutation.updateDocument(get(userSavedCode, 'id'), { isApprovedForDisplay: userSavedCodeStatus.pending });
    }
  }
};

export default updateUserSavedCodeIsApprovedForDisplay;
