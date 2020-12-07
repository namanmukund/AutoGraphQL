import { get } from 'lodash';
import {
  enrollmentTypes,
} from '../../../../constants';
import { log } from '../../../../utils';
import updateSalesOperationEnrollmentTypeToPro from './utils/updateSalesOperationEnrollmentTypeToPro';

/*
  This method adds enrollmentType as pro in salesOperation
*/
const addUserCurrentTopicComponentStatusPostHookMethod = async (input, params) => {
  const userId = get(params, 'userConnectId');
  const { enrollmentType } = input;
  const { pro } = enrollmentTypes;

  if (!userId) {
    log('UserId is missing in input of addUserCurrentTopicComponentStatusPostHookMethod');
  }

  if (enrollmentType === pro) {
    updateSalesOperationEnrollmentTypeToPro(userId);
  }
};

export default addUserCurrentTopicComponentStatusPostHookMethod;
