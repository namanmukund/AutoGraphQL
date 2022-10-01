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
import parseGraphqlResolveInfo from '../../utils/parseGraphqlResolveInfo';

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
        const fieldInfo = parseGraphqlResolveInfo(info);
        /* eslint-enable no-param-reassign */
        const finalArgs = { ...argumentValues, ...args };
        let resolverPromise;
        // the first arg passed still remains root
        if (oldResolve) {
          resolverPromise = oldResolve.call(field, root, finalArgs, context, info);
        } else if (directiveName === 'relationalMeta') {
          /**
           * In case where aggregation is allowed for a type
           * result is stored in a different field called fieldName_DocumentForMeta
           * i.e to avoid any conflict if same field is requested with some filter.
           * Example: if { coursesMeta { count } } is requested
           * we assign courses field data from DB into coursesMeta_DocumentForMeta.
           */
          if (root[`${field.name}_DocumentForMeta`]) resolverPromise = root[`${field.name}_DocumentForMeta`];
          /* relationalMeta will send the result same as that of relation
          for fetching count from query
           */
          else resolverPromise = root[field.name.split(META)[0]];
        } else if (
          /**
           * Checking if field is relational and
           * alias is different from field name
           * i.e {  newCourses: courses { title }  }
           * then return data of aliasName field from root result.
           * This case only arises when using Aggregation Mode for Type.
           */
          (directiveName === 'relation')
          && fieldInfo
          && (fieldInfo.alias !== field.name)
          && root[fieldInfo.alias]
        ) {
          resolverPromise = root[fieldInfo.alias];
        } else {
          resolverPromise = root[field.name];
        }

        // If you return a primitive from the default resolver
        const isPrimitive = !(resolverPromise instanceof Promise);
        if (isPrimitive) {
          resolverPromise = Promise.resolve(resolverPromise);
        }
        // call to the directive resolver with result from default resolver as first arg
        return resolverPromise.then((result) => resolver(result, root, finalArgs, context, info));
      };
    }
  });
});

export default schema;
