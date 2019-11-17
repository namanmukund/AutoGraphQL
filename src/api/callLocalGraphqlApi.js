import { graphql } from 'graphql';
import schema from '../graphql/index';
import { createAndThrowApolloError } from '../../utils';

const callLocalGraphqlApi = (query, context, variables) => {
  const argsOrSchema = schema;
  const source = query;
  const rootValue = {};
  const contextValue = context || {};
  let variableValues = variables || {};

  // Changes for bypassing validations as this is called, from withing the code.
  // Change app to right core app. Here could have used env variable APPLICATION,
  // but that might create problems when APPLICATION=MAX or anything other than core.
  contextValue.decodedApp = {
    name: 'core',
  };
  // Remove decoded user
  delete contextValue.decodedUser;

  // To avoid apollo-server-core error
  if (!variableValues || variableValues === '') {
    variableValues = {};
  }

  return graphql(
    argsOrSchema,
    source,
    rootValue,
    contextValue,
    variableValues,
  ).then((res) => {
    if (res.errors) {
      createAndThrowApolloError(res);
    }
    return res;
  });
};

export default callLocalGraphqlApi;
