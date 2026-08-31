import assert from 'assert';
import {
  createToken,
  createAppToken,
  verifyToken,
  verifyAppToken,
  getExpiryDateForUserToken,
  getExpiryDateForAppToken,
} from '../src/auth';
import authParams from '../config/authParams';
import { ADMIN, USER, GUEST } from '../constants/roles';

describe('AutoGraphQL Core Engine - Authentication & Token Lifecycle', () => {
  const mockUser = {
    id: 'user_12345',
    username: 'johndoe',
    email: 'john@example.com',
    role: USER,
  };

  describe('User Token Generation & Verification', () => {
    it('should generate a valid signed JWT for a user', () => {
      const token = createToken(mockUser);
      assert.ok(typeof token === 'string', 'Generated token should be a string');
      assert.ok(token.length > 20, 'Token length should be valid');

      const decoded = verifyToken(token);
      assert.ok(decoded, 'Token should verify successfully');
      assert.ok(decoded.userInfo, 'Decoded token should contain userInfo object');
      assert.strictEqual(decoded.userInfo.id, mockUser.id, 'Decoded user ID should match');
      assert.strictEqual(decoded.userInfo.username, mockUser.username, 'Decoded username should match');
    });

    it('should fail verification for invalid or tampered tokens', () => {
      const invalidToken = 'invalid.tampered.token';
      const result = verifyToken(invalidToken);
      assert.strictEqual(result, false, 'Invalid token should return false');
    });

    it('should compute token expiry dates according to authParams', () => {
      const standardExpiry = getExpiryDateForUserToken(authParams, { app: { name: 'web' } }, false);
      assert.strictEqual(standardExpiry, authParams.TOKEN_EXPIRY_DATE);

      const forgotPasswordExpiry = getExpiryDateForUserToken(authParams, { app: { name: 'web' } }, true);
      assert.strictEqual(forgotPasswordExpiry, authParams.FORGOT_PASSWORD_EXPIRY_DATE);
    });
  });

  describe('Application Token Generation & Verification', () => {
    it('should generate and verify app token with assigned application name', () => {
      const appToken = createAppToken('web');
      assert.ok(typeof appToken === 'string', 'Generated app token should be a string');

      const decodedApp = verifyAppToken(appToken);
      assert.ok(decodedApp, 'App token should verify successfully');
      assert.ok(decodedApp.appInfo, 'Decoded app should contain appInfo object');
      assert.strictEqual(decodedApp.appInfo.name, 'web', 'App name should match');
    });

    it('should compute app token expiry dates', () => {
      const expiry = getExpiryDateForAppToken(authParams, 'web');
      assert.ok(expiry, 'App token expiry should be returned');
    });
  });

  describe('Framework Roles', () => {
    it('should define standard framework roles (ADMIN, USER, GUEST)', () => {
      assert.strictEqual(ADMIN, 'admin');
      assert.strictEqual(USER, 'user');
      assert.strictEqual(GUEST, 'guest');
    });
  });
});
