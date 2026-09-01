import crypto from 'crypto';
import fetch from 'node-fetch';
import cuid from 'cuid';
import { log } from '../../../utils';

/**
 * Computes an HMAC-SHA256 signature for a webhook payload string.
 *
 * @param {string} payloadString - Serialized JSON payload
 * @param {string} secret - Webhook secret key
 * @returns {string} Hex-encoded HMAC signature
 */
export const computeSignature = (payloadString, secret) => crypto
  .createHmac('sha256', secret || 'default_secret')
  .update(payloadString)
  .digest('hex');

/**
 * Calculates exponential backoff delay in milliseconds.
 * Backoff formula: min(2^attempt * 1000ms, 60000ms)
 *
 * @param {number} attempt - Current attempt count (0, 1, 2...)
 * @returns {number} Delay in milliseconds
 */
export const calculateBackoffMs = (attempt = 0) => Math.min((2 ** attempt) * 1000, 60000);

/**
 * Dispatches an event payload to a target webhook URL.
 *
 * @param {Object} webhook - Webhook destination config
 * @param {string} webhook.url - Destination URL
 * @param {string} [webhook.secret] - Signing secret
 * @param {Object} [webhook.headers] - Custom headers
 * @param {Object} eventPayload - The event payload object
 * @param {number} [timeoutMs=5000] - Request timeout
 * @returns {Promise<{ success: boolean, statusCode: number|null, error: string|null }>}
 */
export const dispatchWebhook = async (webhook, eventPayload, timeoutMs = 5000) => {
  const deliveryId = `del_${cuid()}`;
  const timestamp = new Date().toISOString();
  const bodyString = JSON.stringify(eventPayload);
  const signature = computeSignature(bodyString, webhook.secret);

  const requestHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'AutoGraphQL-Webhook-Engine/1.0',
    'X-AutoGraphQL-Event': eventPayload.event || 'unknown',
    'X-AutoGraphQL-Delivery': deliveryId,
    'X-AutoGraphQL-Signature': `sha256=${signature}`,
    'X-AutoGraphQL-Timestamp': timestamp,
    ...(webhook.headers || {}),
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: requestHeaders,
      body: bodyString,
      timeout: timeoutMs,
    });

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        error: null,
      };
    }

    const errorBody = await response.text().catch(() => '');
    return {
      success: false,
      statusCode: response.status,
      error: `Webhook returned HTTP ${response.status}: ${errorBody.slice(0, 200)}`,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: null,
      error: `Network/connection error: ${err.message}`,
    };
  }
};

export default {
  computeSignature,
  calculateBackoffMs,
  dispatchWebhook,
};
