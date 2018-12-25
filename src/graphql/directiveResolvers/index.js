// the resolvers for the directives defined in your schema
import commonFunctionForRelationAndMeta from './utils/commonFunctionForRelationAndMeta';

const directiveResolvers = {
  async relation(result, root, params, context, info) {
    return commonFunctionForRelationAndMeta(result, root, params, context, info);
  },
  async remote(result) {
    return result;
  },
  async relationalMeta(result, root, params, context, info) {
    return commonFunctionForRelationAndMeta(result, root, params, context, info, true);
  },
};

export default directiveResolvers;
