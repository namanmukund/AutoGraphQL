import {
  enrollmentTypes,
} from '../../../../constants';
import { log } from '../../../../utils';
import updateSalesOperationEnrollmentTypeToPro from './utils/updateSalesOperationEnrollmentTypeToPro';

/*
  This method adds enrollmentType as pro in salesOperation
*/
const updateUserCurrentTopicComponentStatusPostHookMethod = async (input, params, mutationName, context) => {
  const { userId } = context;
  const { enrollmentType } = input;
  const { pro } = enrollmentTypes;

  if (!userId) {
    log('UserId is missing in input of updateUserCurrentTopicComponentStatusPostHookMethod');
  }

  if (enrollmentType === pro) {
    updateSalesOperationEnrollmentTypeToPro(userId);
  }
};

export default updateUserCurrentTopicComponentStatusPostHookMethod;
