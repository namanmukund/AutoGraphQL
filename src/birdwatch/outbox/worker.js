import {
  getPendingEvents,
  markDelivered,
  markFailed,
  recordWebhookDelivery,
} from './index';
import { getWebhooksForEvent } from '../webhooks/manager';
import { dispatchWebhook, calculateBackoffMs } from '../webhooks/dispatcher';
import { log } from '../../../utils';

let workerInterval = null;
let isProcessing = false;

/**
 * Processes all pending outbox events and attempts delivery to matching webhooks.
 *
 * @returns {Promise<{ processed: number, delivered: number, failed: number }>}
 */
export const processPendingEvents = async () => {
  if (isProcessing) return { processed: 0, delivered: 0, failed: 0 };
  isProcessing = true;

  const stats = { processed: 0, delivered: 0, failed: 0 };

  try {
    const pendingEvents = await getPendingEvents(25);
    stats.processed = pendingEvents.length;

    for (const record of pendingEvents) {
      const eventPayload = record.payload || record;
      const webhooks = getWebhooksForEvent(record.event);

      // If no webhooks are registered for this event, auto-complete the outbox item
      if (!webhooks || webhooks.length === 0) {
        await markDelivered(record.id);
        stats.delivered += 1;
        continue;
      }

      const deliveredSet = new Set(record.deliveredWebhooks || []);
      const remainingWebhooks = webhooks.filter((w) => !deliveredSet.has(w.id));

      if (remainingWebhooks.length === 0) {
        await markDelivered(record.id);
        stats.delivered += 1;
        continue;
      }

      let allSuccessful = true;
      let lastErrorMessage = null;

      // Dispatch to each un-delivered webhook
      for (const webhook of remainingWebhooks) {
        const result = await dispatchWebhook(webhook, eventPayload);
        if (result.success) {
          await recordWebhookDelivery(record.id, webhook.id);
        } else {
          allSuccessful = false;
          lastErrorMessage = result.error;
          break; // Stop and schedule retry with backoff for remaining webhooks
        }
      }

      if (allSuccessful) {
        await markDelivered(record.id);
        stats.delivered += 1;
      } else {
        const nextAttempts = (record.attempts || 0) + 1;
        const maxAttempts = record.maxAttempts || 5;
        const maxExceeded = nextAttempts >= maxAttempts;

        const backoffMs = calculateBackoffMs(record.attempts || 0);
        const nextAttemptAt = new Date(Date.now() + backoffMs);

        await markFailed(record.id, lastErrorMessage, nextAttemptAt, maxExceeded);
        stats.failed += 1;
      }
    }
  } catch (err) {
    log(`Outbox worker error during batch execution: ${err.message}`, 'error');
  } finally {
    isProcessing = false;
  }

  return stats;
};

/**
 * Triggers an immediate, non-blocking check of the outbox.
 */
export const triggerOutboxWorker = () => {
  setImmediate(() => {
    processPendingEvents().catch(() => {});
  });
};

/**
 * Starts the periodic outbox background worker.
 *
 * @param {Object} [options]
 * @param {number} [options.intervalMs=2000] - Polling interval in milliseconds
 */
export const startOutboxWorker = ({ intervalMs = 2000 } = {}) => {
  if (workerInterval) return;

  workerInterval = setInterval(() => {
    processPendingEvents().catch(() => {});
  }, intervalMs);

  // Allow Node process to exit without waiting for this interval
  if (workerInterval.unref) {
    workerInterval.unref();
  }

  log('Birdwatch Transactional Outbox worker started', 'status');
};

/**
 * Stops the periodic outbox background worker.
 */
export const stopOutboxWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    log('Birdwatch Transactional Outbox worker stopped', 'status');
  }
};

export default {
  processPendingEvents,
  triggerOutboxWorker,
  startOutboxWorker,
  stopOutboxWorker,
};
