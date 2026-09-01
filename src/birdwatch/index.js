import birdWatchConfig from './birdwatchConfig';
import { createEventPayload } from './eventUtils';
import {
  enqueueEvent,
  getPendingEvents,
  markDelivered,
  markFailed,
  setEventNextAttempt,
  clearInMemoryOutbox,
} from './outbox';
import {
  processPendingEvents,
  triggerOutboxWorker,
  startOutboxWorker,
  stopOutboxWorker,
} from './outbox/worker';
import {
  registerWebhook,
  unregisterWebhook,
  getWebhooksForEvent,
  listWebhooks,
  clearWebhooks,
  matchesEventPattern,
} from './webhooks/manager';
import { log } from '../../utils';

/**
 * Extracts requested fields from input, params, or context based on listener field requirements.
 *
 * @param {Object} fieldsSchema
 * @param {Object} input
 * @param {Object} params
 * @param {Object} context
 * @returns {Object}
 */
export const getParameterValues = (fieldsSchema, input = {}, params = {}, context = {}) => {
  const result = {};
  if (!fieldsSchema || typeof fieldsSchema !== 'object') return result;

  Object.keys(fieldsSchema).forEach((source) => {
    let sourceObj = null;
    if (source === 'input' || source === 'record') {
      sourceObj = input;
    } else if (source === 'params') {
      sourceObj = params;
    } else if (source === 'context') {
      sourceObj = context;
    }

    if (sourceObj && typeof sourceObj === 'object') {
      const fieldList = Array.isArray(fieldsSchema[source])
        ? fieldsSchema[source]
        : Object.keys(fieldsSchema[source]);

      fieldList.forEach((key) => {
        if (sourceObj[key] !== undefined) {
          result[key] = sourceObj[key];
        }
      });
    }
  });

  return result;
};

/**
 * Maps extracted parameter values to action arguments.
 *
 * @param {Object} fields
 * @param {Object} actionFields
 * @returns {Object}
 */
export const getActionArgument = (fields = {}, actionFields = {}) => {
  if (!actionFields || Object.keys(actionFields).length === 0) {
    return fields;
  }

  const output = {};
  Object.keys(actionFields).forEach((key) => {
    if (fields[key] !== undefined) {
      output[key] = fields[key];
    }
  });

  return output;
};

/**
 * Central Birdwatch Event Bus handler.
 * Called automatically by posthook after any mutation succeeds.
 *
 * 1. Creates standardized event payload with actor metadata and operation type.
 * 2. Invokes configured in-process listeners asynchronously.
 * 3. Enqueues event into Transactional Outbox for reliable webhook dispatch.
 * 4. Triggers background worker for immediate dispatch.
 *
 * @param {Object} input - Mutated record output
 * @param {string} mutationName - Name of the mutation executed
 * @param {Object} context - GraphQL execution context
 * @param {Object} params - Mutation input parameters
 * @returns {Promise<Object>} Standardized event payload
 */
export const birdwatch = async (input, mutationName, context = {}, params = {}) => {
  const eventPayload = createEventPayload(input, mutationName, context, params);

  // 1. Process in-process listeners from birdwatchConfig
  if (Array.isArray(birdWatchConfig)) {
    birdWatchConfig.forEach((listener) => {
      const isSubscribed = Array.isArray(listener.on)
        && listener.on.some((pattern) => matchesEventPattern(pattern, mutationName));

      if (isSubscribed && Array.isArray(listener.do)) {
        listener.do.forEach(async (task) => {
          try {
            const { fields: taskFields, action, ...rest } = task;
            const extracted = getParameterValues(taskFields, input, params, context);
            const actionArgs = getActionArgument(extracted, taskFields);

            if (typeof action === 'function') {
              await action({
                ...actionArgs,
                event: eventPayload,
                record: input,
                mutationName,
                context,
                params,
                ...rest,
              });
            }
          } catch (err) {
            log(`Error in Birdwatch in-process listener for "${mutationName}": ${err.message}`, 'error');
          }
        });
      }
    });
  }

  // 2. Enqueue event into Transactional Outbox for webhooks
  try {
    await enqueueEvent(eventPayload);
    // Non-blocking trigger of outbox worker
    triggerOutboxWorker();
  } catch (err) {
    log(`Failed to enqueue outbox event for "${mutationName}": ${err.message}`, 'error');
  }

  return eventPayload;
};

export {
  createEventPayload,
  enqueueEvent,
  getPendingEvents,
  markDelivered,
  markFailed,
  setEventNextAttempt,
  clearInMemoryOutbox,
  registerWebhook,
  unregisterWebhook,
  getWebhooksForEvent,
  listWebhooks,
  clearWebhooks,
  processPendingEvents,
  triggerOutboxWorker,
  startOutboxWorker,
  stopOutboxWorker,
};

export default birdwatch;
