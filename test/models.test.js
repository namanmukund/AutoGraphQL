import assert from 'assert';
import models from '../src/autoGenerate/models';

describe('AutoGraphQL Core Engine - Dynamic Database Model Generation', () => {
  it('should dynamically generate Mongoose Model for User entity', () => {
    const UserModel = models.User;
    assert.ok(UserModel, 'UserModel should be generated');
    assert.strictEqual(UserModel.modelName, 'User', 'Model name must be "User"');

    const schemaPaths = Object.keys(UserModel.schema.paths);
    assert.ok(schemaPaths.includes('name'), 'User schema must include "name" path');
    assert.ok(schemaPaths.includes('email'), 'User schema must include "email" path');
    assert.ok(schemaPaths.includes('username'), 'User schema must include "username" path');
    assert.ok(schemaPaths.includes('role'), 'User schema must include "role" path');
    assert.ok(schemaPaths.includes('status'), 'User schema must include "status" path');
  });

  it('should dynamically generate Mongoose Model for UserProfile entity', () => {
    const ProfileModel = models.UserProfile;
    assert.ok(ProfileModel, 'UserProfile Model should be generated');
    assert.strictEqual(ProfileModel.modelName, 'UserProfile', 'Model name must be "UserProfile"');

    const schemaPaths = Object.keys(ProfileModel.schema.paths);
    assert.ok(schemaPaths.includes('headline'), 'UserProfile schema must include "headline" path');
    assert.ok(schemaPaths.includes('bio'), 'UserProfile schema must include "bio" path');
    assert.ok(schemaPaths.includes('website'), 'UserProfile schema must include "website" path');
    assert.ok(schemaPaths.includes('skills'), 'UserProfile schema must include "skills" path');
  });

  it('should automatically attach timestamps (createdAt & updatedAt) to models', () => {
    const UserModel = models.User;
    const ProfileModel = models.UserProfile;

    const userPaths = Object.keys(UserModel.schema.paths);
    const profilePaths = Object.keys(ProfileModel.schema.paths);

    assert.ok(userPaths.includes('createdAt'), 'User must have "createdAt" timestamp');
    assert.ok(userPaths.includes('updatedAt'), 'User must have "updatedAt" timestamp');
    assert.ok(profilePaths.includes('createdAt'), 'UserProfile must have "createdAt" timestamp');
    assert.ok(profilePaths.includes('updatedAt'), 'UserProfile must have "updatedAt" timestamp');
  });
});
