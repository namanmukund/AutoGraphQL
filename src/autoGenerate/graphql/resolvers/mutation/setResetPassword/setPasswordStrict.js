import bcrypt from 'bcrypt';
import allAuthParams from '../../../../../../config/authParams';
import { operationName } from '../../../../../../constants';
import { MutationController } from '../../../controllers';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
const setPasswordStrictMutationPromise = (searchObj, updateObj, modelMutations) =>
  modelMutations.updateOne(searchObj, updateObj);

export default function setPasswordStrictMutationResolver(
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
    operationName.update,
    fieldsFetched,
    authentication,
    {},
  );

  const modelMutations = new MutationController(typeName, authentication);
  const { id, password } = params;
  const searchObj = { id };
  const hashedPwd = bcrypt.hashSync(password, authParams.SALT);
  const updateObj = { password: hashedPwd, isSetPassword: true };

  return setPasswordStrictMutationPromise(
    searchObj,
    updateObj,
    modelMutations,
  ).then(user => user).catch(err => err);
}
