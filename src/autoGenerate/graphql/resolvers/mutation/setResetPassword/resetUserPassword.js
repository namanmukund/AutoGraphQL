import bcrypt from 'bcrypt';
import allAuthParams from '../../../../../../config/authParams';
import { PasswordMismatchError } from '../../../../../../constants/errors';
import { MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { UPDATE } from '../../../../../../constants/graphqlOperations';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
const resetUserPasswordMutationPromise = (searchObj, updateObj, modelMutations) =>
  modelMutations.updateOne(searchObj, updateObj);

export default function resetUserPasswordMutationResolver(
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) {
  const { fieldNodes } = info;
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
  const modelMutations = new MutationController(typeName, authentication);
  const { id, oldPassword, newPassword, password } = params;
  const valid = bcrypt.compareSync(oldPassword, password);
  if (!valid) {
    throw new PasswordMismatchError();
  }
  const searchObj = { id };
  const hashedNewPwd = bcrypt.hashSync(newPassword, authParams.SALT);
  const updateObj = { password: hashedNewPwd, isSetPassword: true };

  return resetUserPasswordMutationPromise(
    searchObj,
    updateObj,
    modelMutations,
  ).then(user => user)
    .catch(err => err);
}
