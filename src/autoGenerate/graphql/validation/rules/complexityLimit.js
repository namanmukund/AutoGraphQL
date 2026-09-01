import { GraphQLError, Kind } from 'graphql';

/**
 * Creates a GraphQL validation rule to enforce maximum query complexity/cost.
 * Estimates query computational cost based on scalar fields, relations, and pagination multipliers.
 * Prevents resource exhaustion attacks before execution begins.
 *
 * @param {number} maxComplexity - Maximum allowed query complexity score (e.g. 1000)
 * @param {Object} [options]
 * @param {string[]} [options.ignore=['__schema', '__type']] - Field names to exempt
 * @param {number} [options.scalarCost=1] - Cost per scalar field
 * @param {number} [options.objectCost=2] - Cost per object/relation field
 * @returns {Function} GraphQL validation rule
 */
export const createComplexityLimitRule = (maxComplexity = 1000, options = {}) => {
  const {
    ignore = ['__schema', '__type'],
    scalarCost = 1,
    objectCost = 2,
  } = options;

  return (validationContext) => {
    const calculateCost = (node) => {
      if (!node || !node.selectionSet) return 0;

      let cost = 0;

      for (const selection of node.selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
          const fieldName = selection.name.value;
          if (ignore.includes(fieldName)) continue;

          if (selection.selectionSet) {
            // Check for pagination multiplier (e.g. first: 50)
            let multiplier = 1;
            if (selection.arguments && selection.arguments.length) {
              const firstArg = selection.arguments.find((arg) => arg.name.value === 'first' || arg.name.value === 'last');
              if (firstArg && firstArg.value && firstArg.value.kind === Kind.INT) {
                const parsedInt = parseInt(firstArg.value.value, 10);
                if (!Number.isNaN(parsedInt) && parsedInt > 0) {
                  multiplier = Math.min(parsedInt, 100); // capped multiplier for calculation
                }
              }
            }

            const childCost = calculateCost(selection);
            cost += objectCost + (childCost * multiplier);
          } else {
            cost += scalarCost;
          }
        } else if (selection.kind === Kind.INLINE_FRAGMENT) {
          cost += calculateCost(selection);
        } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
          const fragmentName = selection.name.value;
          const fragment = validationContext.getFragment(fragmentName);
          if (fragment) {
            cost += calculateCost(fragment);
          }
        }
      }

      return cost;
    };

    return {
      OperationDefinition(node) {
        const totalComplexity = calculateCost(node);
        if (totalComplexity > maxComplexity) {
          const opName = node.name ? `"${node.name.value}"` : 'Anonymous operation';
          validationContext.reportError(
            new GraphQLError(
              `${opName} exceeds maximum query complexity of ${maxComplexity} (calculated complexity: ${totalComplexity}).`,
              [node],
            ),
          );
        }
      },
    };
  };
};

export default createComplexityLimitRule;
