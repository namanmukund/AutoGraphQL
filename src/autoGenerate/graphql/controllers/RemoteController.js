import { trimStart } from 'lodash';
import { createAppToken } from '../../../auth';
import {
  encodeToken, getQueryFieldString, formatToParamString,
  createApolloFetchRetry,
} from '../../../../utils';
import MasterController from './MasterController';

const application = process.env.APPLICATION || 'core';

/*
* Function to build graphql query parameter.
*
* queryName: Name of the query
* params: Object with object params in { key: value } format
* fields: Object of fields to queried in { key: true } format
*/
const buildGraphQLQuery = (queryName, params, fields) => {
  // Prepare field string.
  const fieldsToQuery = getQueryFieldString(fields);
  // Prepare params string.
  // Loop through the params, to make comma separated parameters.
  let paramString = '';
  if (Object.keys(params).length > 0) {
    paramString = trimStart(formatToParamString(params), '{');
    paramString = paramString.substring(0, paramString.length - 1);
  }
  // Make query string.
  const query = `{ ${queryName}(${paramString}) ${fieldsToQuery} }`;
  return query;
};

class RemoteController extends MasterController {
  constructor(rApplication, authentication) {
    const model = '';
    super(model, authentication);

    const appToken = createAppToken(application, rApplication);
    const token = encodeToken({
      appToken,
      userToken: '',
    });

    this.application = rApplication;
    this.apolloFetch = createApolloFetchRetry();
    /* eslint-disable no-param-reassign */
    this.apolloFetch.use(({ options }, next) => {
      if (!options.headers) {
        options.headers = {};
      }
      options.headers.authorization = token;
      next();
    });
    /* eslint-enable no-param-reassign */
  }

  query(queryName, params, fields) {
    this.validate();
    // Add id field to all query.
    const newFields = { ...fields, id: true };
    const query = buildGraphQLQuery(queryName, params, newFields);
    const variables = '';
    const operationName = '';
    return this.apolloFetch({ query, variables, operationName })
      .then((result) => {
        const { data, errors } = result;
        if (errors) {
          return errors;
        }
        return data[queryName];
      })
      .catch((error) => error);
  }

  deleteMutation(typeName, id, fieldsToMutatue) {
    this.validate();
    const fieldsToQuery = getQueryFieldString(fieldsToMutatue);
    const query = `
      mutation {
        delete${typeName} (id: "${id}")
          ${fieldsToQuery}
      }
    `;

    const variables = {};
    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }

  addMutation(typeName, mutationName, inputCore, fieldsToMutatue) {
    this.validate();
    const fieldsToQuery = getQueryFieldString(fieldsToMutatue);
    let query = {};
    let variables = {};

    query = `
        mutation ($input: ${typeName}Input!) {
          ${mutationName} (input: $input)
            ${fieldsToQuery}
        }
      `;

    variables = {
      input: inputCore,
    };

    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }

  updateMutation(id, input, typeName, mutationName, fieldsToMutatue) {
    this.validate();
    const fieldsToQuery = getQueryFieldString(fieldsToMutatue);
    let query = {};
    let variables = {};

    query = `
        mutation ($input: ${typeName}Input!) {
          ${mutationName} (id: "${id}", input: $input)
            ${fieldsToQuery}
        }
      `;

    variables = {
      input,
    };
    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }

  signUpMutation(typeName = 'SignUp', mutationName, inputCore, fieldsToMutatue) {
    this.validate();
    const fieldsToQuery = getQueryFieldString(fieldsToMutatue);
    let query = {};
    let variables = {};

    query = `
        mutation ($input: ${typeName}Input!) {
          ${mutationName} (input: $input)
            ${fieldsToQuery}
        }
      `;

    variables = {
      input: inputCore,
    };
    // @TODO Implement logic of when the user is already found.
    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }

  loginMutation(typeName = 'Login', queryName, inputCore, fieldsToMutatue) {
    this.validate();
    const fieldsToQuery = getQueryFieldString(fieldsToMutatue);
    let query = {};
    let variables = {};
    query = `
        mutation ($input: ${typeName}Input!) {
          ${queryName} (input: $input)
            ${fieldsToQuery}
        }
      `;
    variables = {
      input: inputCore,
    };
    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }

  relationMutation(mutationName, args, payload) {
    this.validate();
    let query = {};
    const variables = {};
    let argString = trimStart(formatToParamString(args), '{');
    argString = argString.substring(0, argString.length - 1);
    const payloadString = getQueryFieldString(payload);

    query = `
        mutation {
          ${mutationName} (${argString})
            ${payloadString}
        }
      `;
    return this.apolloFetch({ query, variables })
      .then((result) => result)
      .catch((error) => error);
  }
}


export default RemoteController;
