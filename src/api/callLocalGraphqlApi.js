import { graphql } from 'graphql';
import schema from '../graphql/index';
import { createAndThrowApolloError } from '../../utils';

const callLocalGraphqlApi = (query, context, variables) => {
  const argsOrSchema = schema;
  const source = query;
  const rootValue = {};
  const contextValue = context || {};
  let variableValues = variables || {};

  contextValue.currentApp = {
    name: 'core',
  };
  // Remove decoded user
  delete contextValue.currentUser;

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
