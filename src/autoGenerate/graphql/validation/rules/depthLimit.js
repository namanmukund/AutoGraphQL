import { GraphQLError, Kind } from 'graphql';

/**
 * Creates a GraphQL validation rule to enforce maximum query depth.
 * Prevents recursive, deeply-nested or abusive queries from reaching resolvers or the database.
 *
 * @param {number} maxDepth - Maximum allowed query depth (e.g. 8)
 * @param {Object} [options]
 * @param {string[]} [options.ignore=['__schema', '__type']] - Field names to exempt (e.g. introspection)
 * @returns {Function} GraphQL validation rule
 */
export const createDepthLimitRule = (maxDepth = 10, options = {}) => {
  const { ignore = ['__schema', '__type'] } = options;

  return (validationContext) => {
    const checkDepth = (node, currentDepth = 0) => {
      if (!node || !node.selectionSet) return currentDepth;

      let maxChildDepth = currentDepth;

      for (const selection of node.selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const fieldName = selection.name.value;
          if (ignore.includes(fieldName)) continue;

          const childDepth = selection.selectionSet
            ? checkDepth(selection, currentDepth + 1)
            : currentDepth + 1;

          if (childDepth > maxChildDepth) {
            maxChildDepth = childDepth;
          }
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          const childDepth = checkDepth(selection, currentDepth);
          if (childDepth > maxChildDepth) {
            maxChildDepth = childDepth;
          }
        } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const fragmentName = selection.name.value;
          const fragment = validationContext.getFragment(fragmentName);
          if (fragment) {
            const childDepth = checkDepth(fragment, currentDepth);
            if (childDepth > maxChildDepth) {
              maxChildDepth = childDepth;
            }
          }
        }
      }

      return maxChildDepth;
    };

    return {
      OperationDefinition(node) {
        const depth = checkDepth(node, 0);
        if (depth > maxDepth) {
          const opName = node.name ? `"${node.name.value}"` : 'Anonymous operation';
          validationContext.reportError(
            new GraphQLError(
              `${opName} exceeds maximum query depth of ${maxDepth} (calculated depth: ${depth}).`,
              [node],
            ),
          );
        }
      },
    };
  };
};

export default createDepthLimitRule;
