import bcrypt from 'bcryptjs';
import authParams from '../../../../../../config/authParams';
import { DatabaseRecordNotFoundError, PasswordMismatchError } from '../../../../../../constants/errors';
import { MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { UPDATE } from '../../../../../../constants/graphqlOperations';

const findUserMutationPromise = (input, modelQueries) => modelQueries.fetchOne(input);

export default function resetPasswordAndLoginMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
  const {
    phone: { countryCode, number }, password, confirmPassword, email,
  } = params;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate(
    typeName,
    ast,
    UPDATE,
    fieldsFetched,
    authentication,
    {},
  );

  /* Setting user to true if not preset, as reset user password does
   not require user authentication. */
  Object.assign(authentication, {
    user: true,
  });
  let searchUserObj;
  if (countryCode && number) {
    searchUserObj = {
      'phone.countryCode': countryCode,
      'phone.number': number,
    };
  } else {
    searchUserObj = {
      email,
    };
  }
  return findUserMutationPromise(searchUserObj).then((fetchedUser) => {
    if (!fetchedUser) {
      throw new DatabaseRecordNotFoundError();
    }
    console.log(JSON.stringify(fetchedUser), password, confirmPassword);
    const modelMutations = new MutationController(typeName, authentication);
    // const {
    //     id, oldPassword, newPassword, password,
    // } = params;
    // const valid = bcrypt.compareSync(oldPassword, password);
    // if (!valid) {
    //     throw new PasswordMismatchError();
    // }
    // const searchObj = { id };
    // const hashedNewPwd = bcrypt.hashSync(newPassword, authParams.SALT);
    // const updateObj = { password: hashedNewPwd, isSetPassword: true };

    // return resetPasswordAndLoginMutationPromise(
    //     searchObj,
    //     updateObj,
    //     modelMutations,
    // ).then((user) => user)
    //     .catch((err) => err);
  });
}