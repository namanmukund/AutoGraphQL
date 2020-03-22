/* File for defining Graphql Schema(queries and mutations)  */
import { getArgumentValues } from 'graphql/execution/values';
import { makeExecutableSchema, forEachField } from 'apollo-server-express';
import Directives from './directives';
import directiveResolvers from './directiveResolvers';
import {
  query, mutation, filterTypes, relationTypes, sort,
  resolvers, typesWithRelationFilters, groupByTypes,
  subscription, subscriptionPayloadTypes,
} from '../autoGenerate';
import { META } from '../../constants';

const graphqlTypes = [...typesWithRelationFilters, ...relationTypes, sort, ...filterTypes, ...groupByTypes, ...subscriptionPayloadTypes];
const SchemaDefinition = `
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const appResolvers = { ...resolvers };
const appMutation = mutation;
const scalarDefinition = 'scalar Date';
const schema = makeExecutableSchema({
  typeDefs: [
    scalarDefinition,
    SchemaDefinition,
    Directives,
    query,
    appMutation,
    ...graphqlTypes,
    subscription,
  ],
  resolvers: appResolvers,
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      console.log(11111, connectionParams, webSocket);
    },
  },
});

// The utility iterator that patches the original,
// resolver of a field  to apply any directive resolvers.
forEachField(schema, (field) => {
  const directives = field.astNode.directives || [];

  directives.forEach((directive) => {
    const directiveName = directive.name.value;
    const resolver = directiveResolvers[directiveName];
    if (resolver) {
      const oldResolve = field.resolve;

      const Directive = schema.getDirective(directiveName);
      // Resolve the arguments for the directive
      // (ex. for @authenticated it will be { roles: ['admin'] }
      let argumentValues = {};
      if (Directive) {
        argumentValues = getArgumentValues(Directive, directive);
      }
      /* eslint-disable no-param-reassign */
      field.resolve = (root, args, context, info) => {
        /* eslint-enable no-param-reassign */
        const finalArgs = { ...argumentValues, ...args };
        let resolverPromise;
        // the first arg passed still remains root
        if (oldResolve) {
          resolverPromise = oldResolve.call(field, root, finalArgs, context, info);
        } else if (directiveName === 'relationalMeta') {
          /* relationalMeta will send the result same as that of relation
          for fetching count from query
           */
          resolverPromise = root[field.name.split(META)[0]];
        } else {
          resolverPromise = root[field.name];
        }

        // If you return a primitive from the default resolver
        const isPrimitive = !(resolverPromise instanceof Promise);
        if (isPrimitive) {
          resolverPromise = Promise.resolve(resolverPromise);
        }
        // call to the directive resolver with result from default resolver as first arg
        return resolverPromise.then((result) => {
          // console.log(1111111, 'result', result);
          return resolver(result, root, finalArgs, context, info).then((finalR) => {
            // console.log(222222, 'finalR', finalR);
            return finalR;
          });
        });
      };
    }
  });
});

export default schema;
