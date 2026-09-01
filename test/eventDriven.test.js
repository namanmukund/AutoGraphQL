import assert from 'assert';
import http from 'http';
import crypto from 'crypto';
import {
  birdwatch,
  getParameterValues,
  getActionArgument,
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
  clearWebhooks,
  processPendingEvents,
} from '../src/birdwatch';
import { extractOperationAndEntity } from '../src/birdwatch/eventUtils';
import { computeSignature, calculateBackoffMs, dispatchWebhook } from '../src/birdwatch/webhooks/dispatcher';

describe('AutoGraphQL Phase 2: Event-Driven Automation', () => {
  beforeEach(() => {
    clearInMemoryOutbox();
    clearWebhooks();
  });

  describe('1. Mutation Event Extraction & Standardized Payload Creation', () => {
    it('should extract correct operation and entity name from mutation conventions', () => {
      assert.deepStrictEqual(extractOperationAndEntity('addUser'), {
        operation: 'CREATE',
        entityName: 'User',
      });
      assert.deepStrictEqual(extractOperationAndEntity('createPost'), {
        operation: 'CREATE',
        entityName: 'Post',
      });
      assert.deepStrictEqual(extractOperationAndEntity('updateUser'), {
        operation: 'UPDATE',
        entityName: 'User',
      });
      assert.deepStrictEqual(extractOperationAndEntity('deleteUserProfile'), {
        operation: 'DELETE',
        entityName: 'UserProfile',
      });
      assert.deepStrictEqual(extractOperationAndEntity('addToUserPosts'), {
        operation: 'RELATION_ADD',
        entityName: 'UserPosts',
      });
      assert.deepStrictEqual(extractOperationAndEntity('removeFromUserPosts'), {
        operation: 'RELATION_REMOVE',
        entityName: 'UserPosts',
      });
    });

    it('should build standardized event with actor and tracing metadata', () => {
      const mockRecord = { id: 'usr_123', name: 'Naman', email: 'naman@example.com' };
      const mockContext = {
        currentApp: { name: 'admin-portal' },
        currentUser: { id: 'admin_1', role: 'ADMIN' },
      };
      const mockParams = { input: { name: 'Naman' } };

      const event = createEventPayload(mockRecord, 'addUser', mockContext, mockParams);

      assert.ok(event.id.startsWith('evt_'), 'Event ID must have evt_ prefix');
      assert.strictEqual(event.event, 'addUser');
      assert.strictEqual(event.operation, 'CREATE');
      assert.strictEqual(event.entityName, 'User');
      assert.deepStrictEqual(event.data, mockRecord);
      assert.deepStrictEqual(event.params, mockParams);
      assert.strictEqual(event.metadata.appName, 'admin-portal');
      assert.strictEqual(event.metadata.userId, 'admin_1');
      assert.strictEqual(event.metadata.userRole, 'ADMIN');
      assert.ok(event.metadata.timestamp);
    });
  });

  describe('2. In-Process Listeners & Parameter Extraction', () => {
    it('should correctly extract field values from input, params, and context', () => {
      const fieldsSchema = {
        input: ['id', 'email'],
        params: ['sendWelcomeEmail'],
        context: ['traceId'],
      };
      const input = { id: 'u1', email: 'test@autographql.com', secretField: 'hidden' };
      const params = { sendWelcomeEmail: true, otherParam: 123 };
      const context = { traceId: 'tr_abc' };

      const extracted = getParameterValues(fieldsSchema, input, params, context);

      assert.strictEqual(extracted.id, 'u1');
      assert.strictEqual(extracted.email, 'test@autographql.com');
      assert.strictEqual(extracted.sendWelcomeEmail, true);
      assert.strictEqual(extracted.traceId, 'tr_abc');
      assert.strictEqual(extracted.secretField, undefined, 'Unspecified fields must not be extracted');
    });

    it('should map extracted fields to action arguments', () => {
      const extracted = { id: 'u1', email: 'test@autographql.com', count: 5 };
      const actionFields = { id: true, email: true };

      const actionArgs = getActionArgument(extracted, actionFields);
      assert.deepStrictEqual(actionArgs, { id: 'u1', email: 'test@autographql.com' });
    });
  });

  describe('3. Transactional Outbox Engine', () => {
    it('should enqueue event to outbox with PENDING status', async () => {
      const event = {
        id: 'evt_test_1',
        event: 'addUser',
        operation: 'CREATE',
        entityName: 'User',
        data: { id: 'u1', name: 'Alice' },
        params: {},
        metadata: { timestamp: new Date().toISOString() },
      };

      const record = await enqueueEvent(event);
      assert.strictEqual(record.id, 'evt_test_1');
      assert.strictEqual(record.status, 'PENDING');
      assert.strictEqual(record.attempts, 0);

      const pending = await getPendingEvents();
      const match = pending.find((e) => e.id === 'evt_test_1');
      assert.ok(match, 'Enqueued event must appear in pending list');
    });

    it('should transition event status to DELIVERED upon completion', async () => {
      const event = {
        id: 'evt_test_2',
        event: 'updateUser',
        operation: 'UPDATE',
        entityName: 'User',
        data: { id: 'u2' },
      };

      await enqueueEvent(event);
      await markDelivered('evt_test_2');

      const pending = await getPendingEvents();
      const match = pending.find((e) => e.id === 'evt_test_2');
      assert.strictEqual(match, undefined, 'Delivered event must no longer be pending');
    });

    it('should record failure, increment attempts, and mark FAILED when max attempts exceeded', async () => {
      const event = {
        id: 'evt_test_3',
        event: 'deleteUser',
        operation: 'DELETE',
        entityName: 'User',
        data: { id: 'u3' },
      };

      await enqueueEvent(event);

      // Attempt 1: Failed with backoff
      const nextDate = new Date(Date.now() + 5000);
      await markFailed('evt_test_3', 'Network timeout', nextDate, false);

      // Attempt 5 (max attempts): Mark permanently FAILED
      await markFailed('evt_test_3', 'Permanent failure: 404 Not Found', nextDate, true);

      const pending = await getPendingEvents();
      const match = pending.find((e) => e.id === 'evt_test_3');
      assert.strictEqual(match, undefined, 'FAILED event must no longer be pending');
    });
  });

  describe('4. Webhook Registry & Pattern Matching', () => {
    it('should register and match webhooks using exact names and wildcards', () => {
      const wh1 = registerWebhook({ url: 'https://example.com/all', events: ['*'] });
      const wh2 = registerWebhook({ url: 'https://example.com/users', events: ['addUser', 'updateUser'] });
      const wh3 = registerWebhook({ url: 'https://example.com/posts', events: ['*Post'] });

      // Match addUser
      const matchesAddUser = getWebhooksForEvent('addUser');
      const urlsAddUser = matchesAddUser.map((w) => w.url);
      assert.ok(urlsAddUser.includes('https://example.com/all'));
      assert.ok(urlsAddUser.includes('https://example.com/users'));
      assert.ok(!urlsAddUser.includes('https://example.com/posts'));

      // Match addPost
      const matchesAddPost = getWebhooksForEvent('addPost');
      const urlsAddPost = matchesAddPost.map((w) => w.url);
      assert.ok(urlsAddPost.includes('https://example.com/all'));
      assert.ok(!urlsAddPost.includes('https://example.com/users'));

      // Unregister
      unregisterWebhook(wh1.id);
      assert.strictEqual(getWebhooksForEvent('addUser').length, 1);
    });
  });

  describe('5. Webhook Dispatcher & HMAC-SHA256 Signing', () => {
    it('should compute valid HMAC-SHA256 signature for payload verification', () => {
      const payloadString = JSON.stringify({ event: 'addUser', data: { id: '123' } });
      const secret = 'super_secret_key_123';

      const signature = computeSignature(payloadString, secret);
      const expected = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

      assert.strictEqual(signature, expected, 'Signature must match standard crypto HMAC');
    });

    it('should correctly calculate exponential backoff delay', () => {
      assert.strictEqual(calculateBackoffMs(0), 1000); // 2^0 * 1000 = 1000ms
      assert.strictEqual(calculateBackoffMs(1), 2000); // 2^1 * 1000 = 2000ms
      assert.strictEqual(calculateBackoffMs(2), 4000); // 2^2 * 1000 = 4000ms
      assert.strictEqual(calculateBackoffMs(3), 8000); // 2^3 * 1000 = 8000ms
      assert.strictEqual(calculateBackoffMs(10), 60000); // Capped at 60s
    });

    it('should deliver webhook with security headers to a mock HTTP endpoint', async () => {
      let receivedHeaders = null;
      let receivedBody = null;

      // Start local mock HTTP webhook receiver
      const mockServer = http.createServer((req, res) => {
        receivedHeaders = req.headers;
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          receivedBody = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true }));
        });
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const port = mockServer.address().port;
      const targetUrl = `http://127.0.0.1:${port}/webhook`;

      const webhook = {
        url: targetUrl,
        secret: 'webhook_secret_xyz',
      };

      const eventPayload = {
        id: 'evt_wh_test',
        event: 'addUser',
        operation: 'CREATE',
        entityName: 'User',
        data: { id: 'u_100', name: 'Bob' },
      };

      const result = await dispatchWebhook(webhook, eventPayload);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(receivedHeaders['x-autographql-event'], 'addUser');
      assert.ok(receivedHeaders['x-autographql-delivery'].startsWith('del_'));
      assert.ok(receivedHeaders['x-autographql-signature'].startsWith('sha256='));
      assert.deepStrictEqual(receivedBody, eventPayload);

      // Close mock server
      await new Promise((resolve) => mockServer.close(resolve));
    });

    it('should report failure when webhook endpoint returns HTTP 500 error', async () => {
      const mockServer = http.createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error in Webhook Destination');
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const port = mockServer.address().port;

      const webhook = {
        url: `http://127.0.0.1:${port}/fail-webhook`,
        secret: 'secret',
      };

      const result = await dispatchWebhook(webhook, { id: '1', event: 'addUser' });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 500);
      assert.ok(result.error.includes('HTTP 500'));

      await new Promise((resolve) => mockServer.close(resolve));
    });
  });

  describe('6. End-to-End Outbox Worker & birdwatch() Triggering', () => {
    it('should dispatch enqueued outbox events to registered webhooks via processPendingEvents()', async () => {
      let delivered = false;

      const mockServer = http.createServer((req, res) => {
        delivered = true;
        res.writeHead(200);
        res.end('OK');
      });

      await new Promise((resolve) => mockServer.listen(0, resolve));
      const port = mockServer.address().port;

      // Register webhook
      registerWebhook({
        url: `http://127.0.0.1:${port}/hook`,
        events: ['addUser'],
        secret: 'test_sec',
      });

      // Call birdwatch() as posthook does
      const input = { id: 'user_42', name: 'Grace Hopper' };
      await birdwatch(input, 'addUser', { currentApp: { name: 'admin' } }, { input });

      // Run worker
      const stats = await processPendingEvents();

      assert.strictEqual(stats.processed >= 1, true);
      assert.strictEqual(stats.delivered >= 1, true);
      await new Promise((resolve) => mockServer.close(resolve));
    });

    it('should not duplicate delivery to already-succeeded webhooks on subsequent retries', async () => {
      let wh1CallCount = 0;
      let wh2CallCount = 0;

      // Webhook 1 succeeds
      const server1 = http.createServer((req, res) => {
        wh1CallCount += 1;
        res.writeHead(200);
        res.end('OK');
      });

      // Webhook 2 fails on first try, succeeds on second try
      const server2 = http.createServer((req, res) => {
        wh2CallCount += 1;
        if (wh2CallCount === 1) {
          res.writeHead(500);
          res.end('Temporary Error');
        } else {
          res.writeHead(200);
          res.end('OK');
        }
      });

      await new Promise((resolve) => server1.listen(0, resolve));
      await new Promise((resolve) => server2.listen(0, resolve));

      const port1 = server1.address().port;
      const port2 = server2.address().port;

      registerWebhook({ id: 'wh_succ', url: `http://127.0.0.1:${port1}/ok`, events: ['testEvent'] });
      registerWebhook({ id: 'wh_fail', url: `http://127.0.0.1:${port2}/retry`, events: ['testEvent'] });

      const event = {
        id: 'evt_dedup_test',
        event: 'testEvent',
        operation: 'CUSTOM',
        entityName: 'Test',
        data: { id: 't1' },
      };

      await enqueueEvent(event);

      // Attempt 1: wh_succ succeeds, wh_fail returns 500
      const stats1 = await processPendingEvents();
      assert.strictEqual(wh1CallCount, 1, 'Webhook 1 should be called once');
      assert.strictEqual(wh2CallCount, 1, 'Webhook 2 should be called once');
      assert.strictEqual(stats1.failed, 1, 'Batch marked failed due to Webhook 2 failure');

      // Reset nextAttemptAt to the past to simulate elapsed backoff timer
      await setEventNextAttempt('evt_dedup_test', new Date(Date.now() - 1000));

      // Attempt 2: wh_succ should be SKIPPED, wh_fail should succeed
      const stats2 = await processPendingEvents();
      assert.strictEqual(wh1CallCount, 1, 'Webhook 1 must NOT be called again on retry');
      assert.strictEqual(wh2CallCount, 2, 'Webhook 2 should be called on retry');
      assert.strictEqual(stats2.delivered, 1, 'Event should now be delivered');

      await new Promise((resolve) => server1.close(resolve));
      await new Promise((resolve) => server2.close(resolve));
    });
  });
});
