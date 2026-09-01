import cuid from 'cuid';

/**
 * Parses a mutation name to extract the underlying operation and entity name.
 * Handles standard AutoGraphQL mutation naming conventions (add, update, delete, relations).
 *
 * @param {string} mutationName
 * @returns {{ operation: string, entityName: string }}
 */
export const extractOperationAndEntity = (mutationName = '') => {
  if (!mutationName || typeof mutationName !== 'string') {
    return { operation: 'UNKNOWN', entityName: 'Unknown' };
  }

  if (mutationName.startsWith('addTo')) {
    return {
      operation: 'RELATION_ADD',
      entityName: mutationName.slice(5) || 'Relation',
    };
  }

  if (mutationName.startsWith('removeFrom')) {
    return {
      operation: 'RELATION_REMOVE',
      entityName: mutationName.slice(10) || 'Relation',
    };
  }

  if (mutationName.startsWith('addUser') || mutationName.startsWith('add')) {
    return {
      operation: 'CREATE',
      entityName: mutationName.slice(3) || 'Entity',
    };
  }

  if (mutationName.startsWith('create')) {
    return {
      operation: 'CREATE',
      entityName: mutationName.slice(6) || 'Entity',
    };
  }

  if (mutationName.startsWith('updateMultiple') || mutationName.startsWith('updateUsers')) {
    return {
      operation: 'UPDATE_BATCH',
      entityName: mutationName.replace(/^update(Multiple)?/, '') || 'Entity',
    };
  }

  if (mutationName.startsWith('update')) {
    return {
      operation: 'UPDATE',
      entityName: mutationName.slice(6) || 'Entity',
    };
  }

  if (mutationName.startsWith('deleteMultiple') || mutationName.startsWith('deleteUsers')) {
    return {
      operation: 'DELETE_BATCH',
      entityName: mutationName.replace(/^delete(Multiple)?/, '') || 'Entity',
    };
  }

  if (mutationName.startsWith('delete')) {
    return {
      operation: 'DELETE',
      entityName: mutationName.slice(6) || 'Entity',
    };
  }

  return {
    operation: 'CUSTOM',
    entityName: mutationName,
  };
};

/**
 * Creates a standardized event payload from mutation execution inputs.
 *
 * @param {Object} input - Mutated record output
 * @param {string} mutationName - Name of the mutation
 * @param {Object} context - GraphQL context
 * @param {Object} params - Mutation input parameters
 * @returns {Object} Standardized event object
 */
export const createEventPayload = (input, mutationName, context = {}, params = {}) => {
  const { operation, entityName } = extractOperationAndEntity(mutationName);

  const eventId = `evt_${cuid()}`;
  const timestamp = new Date().toISOString();

  // Extract actor and client metadata
  const currentApp = context.currentApp || (context.app ? context.app : null);
  const currentUser = context.currentUser || (context.user ? context.user : null);

  const metadata = {
    eventId,
    timestamp,
    appName: currentApp ? (currentApp.name || currentApp) : 'anonymous',
    userId: currentUser ? (currentUser.id || currentUser) : null,
    userRole: currentUser ? currentUser.role : null,
  };

  return {
    id: eventId,
    event: mutationName,
    operation,
    entityName,
    data: input,
    params,
    metadata,
  };
};

export default {
  extractOperationAndEntity,
  createEventPayload,
};
