import mongoose from 'mongoose';
import OutboxEvent from './model';
import { log } from '../../../utils';

// In-memory fallback queue for offline / test environments
const inMemoryOutbox = new Map();

/**
 * Checks whether MongoDB connection is actively ready.
 * @returns {boolean}
 */
const isMongoConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Enqueues a standardized event to the Transactional Outbox.
 *
 * @param {Object} event - Standardized event payload
 * @returns {Promise<Object>} The stored outbox record
 */
export const enqueueEvent = async (event) => {
  const recordData = {
    id: event.id,
    event: event.event,
    operation: event.operation,
    entityName: event.entityName,
    payload: event,
    status: 'PENDING',
    attempts: 0,
    maxAttempts: 5,
    deliveredWebhooks: [],
    nextAttemptAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isMongoConnected()) {
    try {
      const doc = await OutboxEvent.create(recordData);
      return doc.toObject ? doc.toObject() : doc;
    } catch (err) {
      log(`Failed to persist outbox event to MongoDB, falling back to memory queue: ${err.message}`, 'error');
    }
  }

  // Fallback to in-memory queue
  inMemoryOutbox.set(event.id, recordData);
  return recordData;
};

/**
 * Retrieves pending events ready for dispatch.
 *
 * @param {number} [limit=50]
 * @returns {Promise<Array<Object>>}
 */
export const getPendingEvents = async (limit = 50) => {
  const now = new Date();

  if (isMongoConnected()) {
    try {
      const docs = await OutboxEvent.find({
        status: 'PENDING',
        nextAttemptAt: { $lte: now },
      })
        .sort({ createdAt: 1 })
        .limit(limit)
        .lean()
        .exec();

      if (docs && docs.length > 0) {
        return docs;
      }
    } catch (err) {
      log(`Error querying pending outbox events from MongoDB: ${err.message}`, 'error');
    }
  }

  // Check in-memory queue
  const pending = [];
  inMemoryOutbox.forEach((item) => {
    if (item.status === 'PENDING' && item.nextAttemptAt <= now) {
      pending.push(item);
    }
  });

  return pending.slice(0, limit);
};

/**
 * Marks an outbox event as successfully delivered.
 *
 * @param {string} eventId
 * @returns {Promise<void>}
 */
export const markDelivered = async (eventId) => {
  if (isMongoConnected()) {
    try {
      await OutboxEvent.updateOne(
        { id: eventId },
        {
          status: 'DELIVERED',
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        },
      ).exec();
    } catch (err) {
      log(`Error marking outbox event delivered in MongoDB: ${err.message}`, 'error');
    }
  }

  if (inMemoryOutbox.has(eventId)) {
    const item = inMemoryOutbox.get(eventId);
    item.status = 'DELIVERED';
    item.lastAttemptAt = new Date();
    item.updatedAt = new Date();
  }
};

/**
 * Records a delivery failure, calculates backoff or flags as permanently FAILED.
 *
 * @param {string} eventId
 * @param {string} errorMessage
 * @param {Date} nextAttemptAt
 * @param {boolean} [maxExceeded=false]
 * @returns {Promise<void>}
 */
export const markFailed = async (eventId, errorMessage, nextAttemptAt, maxExceeded = false) => {
  const updateData = {
    $inc: { attempts: 1 },
    lastAttemptAt: new Date(),
    nextAttemptAt,
    lastError: String(errorMessage),
    status: maxExceeded ? 'FAILED' : 'PENDING',
    updatedAt: new Date(),
  };

  if (isMongoConnected()) {
    try {
      await OutboxEvent.updateOne({ id: eventId }, updateData).exec();
    } catch (err) {
      log(`Error recording outbox failure in MongoDB: ${err.message}`, 'error');
    }
  }

  if (inMemoryOutbox.has(eventId)) {
    const item = inMemoryOutbox.get(eventId);
    item.attempts += 1;
    item.lastAttemptAt = new Date();
    item.nextAttemptAt = nextAttemptAt;
    item.lastError = String(errorMessage);
    item.status = maxExceeded ? 'FAILED' : 'PENDING';
    item.updatedAt = new Date();
  }
};

/**
 * Records a successful delivery for a specific webhook on an outbox event.
 * Prevents duplicate webhook deliveries on subsequent retry attempts.
 *
 * @param {string} eventId
 * @param {string} webhookId
 * @returns {Promise<void>}
 */
export const recordWebhookDelivery = async (eventId, webhookId) => {
  if (isMongoConnected()) {
    try {
      await OutboxEvent.updateOne(
        { id: eventId },
        { $addToSet: { deliveredWebhooks: webhookId } },
      ).exec();
    } catch (err) {
      log(`Error recording webhook delivery in MongoDB: ${err.message}`, 'error');
    }
  }

  if (inMemoryOutbox.has(eventId)) {
    const item = inMemoryOutbox.get(eventId);
    if (!item.deliveredWebhooks) item.deliveredWebhooks = [];
    if (!item.deliveredWebhooks.includes(webhookId)) {
      item.deliveredWebhooks.push(webhookId);
    }
  }
};

/**
 * Updates nextAttemptAt for a specific outbox event (useful for retry scheduling and tests).
 *
 * @param {string} eventId
 * @param {Date} nextAttemptAt
 * @returns {Promise<void>}
 */
export const setEventNextAttempt = async (eventId, nextAttemptAt) => {
  if (isMongoConnected()) {
    try {
      await OutboxEvent.updateOne({ id: eventId }, { nextAttemptAt }).exec();
    } catch (err) {
      log(`Error updating nextAttemptAt in MongoDB: ${err.message}`, 'error');
    }
  }

  if (inMemoryOutbox.has(eventId)) {
    inMemoryOutbox.get(eventId).nextAttemptAt = nextAttemptAt;
  }
};

/**
 * Clears the in-memory outbox (primarily for testing).
 */
export const clearInMemoryOutbox = () => {
  inMemoryOutbox.clear();
};

export default {
  enqueueEvent,
  getPendingEvents,
  markDelivered,
  markFailed,
  recordWebhookDelivery,
  setEventNextAttempt,
  clearInMemoryOutbox,
};
