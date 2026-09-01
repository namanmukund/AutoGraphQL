import cuid from 'cuid';

// In-memory webhook registry
const webhookRegistry = new Map();

/**
 * Normalizes an event pattern matcher. Supports wildcards e.g. "addUser", "update*", or "*".
 *
 * @param {string} pattern - Configured event pattern
 * @param {string} event - Actual mutation event name
 * @returns {boolean}
 */
export const matchesEventPattern = (pattern, event) => {
  if (!pattern || !event) return false;
  if (pattern === '*' || pattern === 'all') return true;
  if (pattern === event) return true;
  if (pattern.startsWith('*') && pattern.endsWith('*') && pattern.length > 2) {
    const substring = pattern.slice(1, -1);
    return event.includes(substring);
  }
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1);
    return event.endsWith(suffix);
  }
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return event.startsWith(prefix);
  }
  return false;
};

/**
 * Registers a new webhook subscription.
 *
 * @param {Object} options
 * @param {string} options.url - Destination HTTP/HTTPS endpoint
 * @param {string|string[]} [options.events=['*']] - Events or patterns to listen to
 * @param {string} [options.secret] - Signing secret for HMAC signature verification
 * @param {Object} [options.headers={}] - Custom headers (e.g. Authorization)
 * @param {string} [options.id] - Optional custom ID
 * @returns {Object} The registered webhook descriptor
 */
export const registerWebhook = ({
  url,
  events = ['*'],
  secret = process.env.AUTOGRAPHQL_WEBHOOK_SECRET || 'default_secret',
  headers = {},
  id = `wh_${cuid()}`,
}) => {
  if (!url) {
    throw new Error('Webhook URL is required');
  }

  const normalizedEvents = Array.isArray(events) ? events : [events];

  const webhook = {
    id,
    url,
    events: normalizedEvents,
    secret,
    headers,
    active: true,
    createdAt: new Date(),
  };

  webhookRegistry.set(id, webhook);
  return webhook;
};

/**
 * Removes a registered webhook by ID.
 * @param {string} id
 * @returns {boolean}
 */
export const unregisterWebhook = (id) => webhookRegistry.delete(id);

/**
 * Returns all active webhooks subscribed to a specific mutation event.
 *
 * @param {string} eventName - e.g. "addUser", "updatePost"
 * @returns {Array<Object>}
 */
export const getWebhooksForEvent = (eventName) => {
  const matching = [];
  webhookRegistry.forEach((webhook) => {
    if (!webhook.active) return;
    const isMatch = webhook.events.some((pattern) => matchesEventPattern(pattern, eventName));
    if (isMatch) {
      matching.push(webhook);
    }
  });
  return matching;
};

/**
 * Lists all registered webhooks.
 * @returns {Array<Object>}
 */
export const listWebhooks = () => Array.from(webhookRegistry.values());

/**
 * Clears all registered webhooks (useful for testing).
 */
export const clearWebhooks = () => {
  webhookRegistry.clear();
};

// Initialize static webhooks from environment variable if provided (e.g. AUTOGRAPHQL_WEBHOOK_URLS="https://hook1.com,https://hook2.com")
if (process.env.AUTOGRAPHQL_WEBHOOK_URLS) {
  const urls = process.env.AUTOGRAPHQL_WEBHOOK_URLS.split(',').map((u) => u.trim()).filter(Boolean);
  urls.forEach((url) => {
    registerWebhook({ url, events: ['*'] });
  });
}

export default {
  registerWebhook,
  unregisterWebhook,
  getWebhooksForEvent,
  listWebhooks,
  clearWebhooks,
};
