import { PermissionDeniedError } from '../../constants/errors';
import { log } from '../../utils';

// Registry of model RLS policies: Map<string, { field: string, claim: string, type: 'tenant'|'owner' }>
const rlsPolicyRegistry = new Map();

/**
 * Registers an RLS policy for a model.
 *
 * @param {string} modelName
 * @param {Object} policy
 * @param {string} [policy.field='tenantId'] - Model property name to constrain
 * @param {string} [policy.claim='tenantId'] - Key in GraphQL context / user token
 * @param {'tenant'|'owner'} [policy.type='tenant']
 */
export const registerModelRLSPolicy = (modelName, policy = {}) => {
  if (!modelName) return;
  rlsPolicyRegistry.set(modelName, {
    field: policy.field || (policy.type === 'owner' ? 'userId' : 'tenantId'),
    claim: policy.claim || (policy.type === 'owner' ? 'userId' : 'tenantId'),
    type: policy.type || 'tenant',
  });
};

/**
 * Retrieves the registered RLS policy for a model.
 *
 * @param {string} modelName
 * @returns {Object|null}
 */
export const getModelRLSPolicy = (modelName) => rlsPolicyRegistry.get(modelName) || null;

/**
 * Lists all registered model RLS policies.
 *
 * @returns {Object}
 */
export const listRLSPolicies = () => {
  const policies = {};
  rlsPolicyRegistry.forEach((val, key) => {
    policies[key] = val;
  });
  return policies;
};

/**
 * Extracts a claim value from GraphQL execution context or authenticated user/app tokens.
 *
 * @param {Object} context
 * @param {string} claim
 * @returns {string|null}
 */
export const getClaimValueFromContext = (context = {}, claim = 'tenantId') => {
  if (!context || typeof context !== 'object') return null;

  // Direct context property
  if (context[claim]) return String(context[claim]);
  if (claim === 'tenantId' && context.tenant) return String(context.tenant.id || context.tenant);
  if (claim === 'userId' && context.userId) return String(context.userId);

  // User token claims
  const user = context.user || context.currentUser;
  if (user && typeof user === 'object') {
    if (user[claim]) return String(user[claim]);
    if (claim === 'userId' && user.id) return String(user.id);
    if (claim === 'tenantId' && user.tenantId) return String(user.tenantId);
    if (claim === 'tenantId' && user.organizationId) return String(user.organizationId);
  }

  // App token claims
  const app = context.app || context.currentApp;
  if (app && typeof app === 'object') {
    if (app[claim]) return String(app[claim]);
    if (claim === 'tenantId' && app.tenantId) return String(app.tenantId);
  }

  return null;
};

/**
 * Checks if the request actor is exempt from RLS restrictions (e.g. system admin or explicit bypass).
 *
 * @param {Object} context
 * @returns {boolean}
 */
export const isRLSExempt = (context = {}) => {
  if (!context) return false;
  if (context.bypass === true) return true;

  const user = context.user || context.currentUser;
  if (user && typeof user === 'object') {
    const role = user.role || (Array.isArray(user.roles) ? user.roles[0] : null);
    if (role && (role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'SYSTEM')) {
      return true;
    }
  }

  return false;
};

/**
 * Applies Row-Level Security constraints to read queries.
 * Injects tenant/owner filter conditions automatically into database queries.
 *
 * @param {Object} options
 * @param {string} options.modelName
 * @param {Object} [options.filter={}]
 * @param {Object} [options.context={}]
 * @returns {Object} Secured query filter
 */
export const applyRowLevelSecurity = ({ modelName, filter = {}, context = {} }) => {
  const policy = getModelRLSPolicy(modelName);
  if (!policy) return filter;

  // Admin / internal bypass
  if (isRLSExempt(context)) {
    return filter;
  }

  const claimValue = getClaimValueFromContext(context, policy.claim);
  if (!claimValue) {
    const errorMsg = `Multi-Tenancy Access Denied: Missing required "${policy.claim}" in execution context for model "${modelName}".`;
    throw new PermissionDeniedError({
      message: errorMsg,
      data: { message: errorMsg },
    });
  }

  // Enforce tenant/owner condition, strictly overriding any client-supplied spoofed tenant IDs
  return {
    ...(filter || {}),
    [policy.field]: claimValue,
  };
};

/**
 * Injects tenant/owner attributes into record creation inputs.
 *
 * @param {Object} options
 * @param {string} options.modelName
 * @param {Object} options.input
 * @param {Object} options.context
 * @returns {Object}
 */
export const applyRLSToInput = ({ modelName, input = {}, context = {} }) => {
  const policy = getModelRLSPolicy(modelName);
  if (!policy) return input;

  if (isRLSExempt(context)) {
    return input;
  }

  const claimValue = getClaimValueFromContext(context, policy.claim);
  if (!claimValue) {
    const errorMsg = `Multi-Tenancy Access Denied: Missing required "${policy.claim}" to create record for model "${modelName}".`;
    throw new PermissionDeniedError({
      message: errorMsg,
      data: { message: errorMsg },
    });
  }

  return {
    ...input,
    [policy.field]: claimValue,
  };
};

/**
 * Verifies that a target record belongs to the active tenant/owner before updating or deleting.
 *
 * @param {Object} options
 * @param {string} options.modelName
 * @param {Object} options.record
 * @param {Object} options.context
 * @returns {boolean}
 */
export const verifyRLSOwnership = ({ modelName, record, context = {} }) => {
  const policy = getModelRLSPolicy(modelName);
  if (!policy || !record) return true;

  if (isRLSExempt(context)) {
    return true;
  }

  const claimValue = getClaimValueFromContext(context, policy.claim);
  if (!claimValue) {
    const errorMsg = `Multi-Tenancy Access Denied: Missing required "${policy.claim}" in context.`;
    throw new PermissionDeniedError({
      message: errorMsg,
      data: { message: errorMsg },
    });
  }

  const recordTenantValue = String(record[policy.field] || '');
  if (recordTenantValue !== claimValue) {
    const errorMsg = 'Multi-Tenancy Access Denied: You do not have permission to modify this record.';
    throw new PermissionDeniedError({
      message: errorMsg,
      data: { message: errorMsg },
    });
  }

  return true;
};

/**
 * Clears registered RLS policies (primarily for test isolation).
 */
export const clearRLSPolicies = () => {
  rlsPolicyRegistry.clear();
};

export default {
  registerModelRLSPolicy,
  getModelRLSPolicy,
  getClaimValueFromContext,
  isRLSExempt,
  applyRowLevelSecurity,
  applyRLSToInput,
  verifyRLSOwnership,
  clearRLSPolicies,
};
