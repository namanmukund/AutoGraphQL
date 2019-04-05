import { DatabaseRecordNotFoundError, OTPMismatchError } from '../../../../../../constants/errors';
import { QueryController, MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';

const validateUserOTPMutationPromise = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

export default function validateUserOTPMutationResolver(
  root,
  params,
  typeName,
  info,
  fields,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    typeName,
    ast,
    SINGULAR,
    fieldsFetched,
    authentication,
  );

  const queryController = new QueryController(typeName, authentication);
  const { id, phoneOtp, emailOtp } = params;
  return queryController.fetchOne({ id }).then((res) => {
    if (!res) {
      throw new DatabaseRecordNotFoundError();
    }
    const searchObj = { id };
    let updateObj;
    if (phoneOtp) {
      if (res.phoneOtp !== phoneOtp) {
        throw new OTPMismatchError();
      }
      updateObj = {
        phoneVerified: true,
        status: 'active',
      };
    } else {
      if (res.emailOtp !== emailOtp) {
        throw new OTPMismatchError();
      }
      updateObj = {
        emailVerified: true,
        status: 'active',
      };
    }

    const modelMutations = new MutationController(typeName, authentication);
    return validateUserOTPMutationPromise(
      searchObj,
      updateObj,
      modelMutations,
    ).then((result) => {
      if (!result) {
        throw new DatabaseRecordNotFoundError();
      }

      return result;
    });
  });
}
