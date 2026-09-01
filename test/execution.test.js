import assert from 'assert';
import { graphql } from 'graphql';
import schema from '../src/graphql';

describe('AutoGraphQL Core Engine - GraphQL Execution & Introspection', () => {
  it('should successfully execute schema introspection query', async () => {
    const introspectionQuery = `
      query IntrospectTypes {
        __schema {
          types {
            name
            kind
          }
        }
      }
    `;

    const result = await graphql(schema, introspectionQuery);
    assert.ok(result.data, 'Introspection query should return data');
    assert.ok(!result.errors, 'Introspection query should have no errors');

    const typeNames = result.data.__schema.types.map((t) => t.name);
    assert.ok(typeNames.includes('User'), 'Schema must include User type');
    assert.ok(typeNames.includes('UserProfile'), 'Schema must include UserProfile type');
    assert.ok(typeNames.includes('Post'), 'Schema must include Post type');
    assert.ok(typeNames.includes('Comment'), 'Schema must include Comment type');
    assert.ok(typeNames.includes('Category'), 'Schema must include Category type');
    assert.ok(typeNames.includes('Tag'), 'Schema must include Tag type');
  });

  it('should inspect fields and relations of User and UserProfile types', async () => {
    const fieldsQuery = `
      query IntrospectUserFields {
        __type(name: "User") {
          name
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    `;

    const result = await graphql(schema, fieldsQuery);
    assert.ok(result.data.__type, 'User type must be introspectable');
    const fieldNames = result.data.__type.fields.map((f) => f.name);

    assert.ok(fieldNames.includes('id'), 'User must have "id" field');
    assert.ok(fieldNames.includes('name'), 'User must have "name" field');
    assert.ok(fieldNames.includes('email'), 'User must have "email" field');
    assert.ok(fieldNames.includes('username'), 'User must have "username" field');
    assert.ok(fieldNames.includes('role'), 'User must have "role" field');
    assert.ok(fieldNames.includes('profile'), 'User must have "profile" relational field');
    assert.ok(fieldNames.includes('posts'), 'User must have "posts" relational field');
    assert.ok(fieldNames.includes('comments'), 'User must have "comments" relational field');
    assert.ok(fieldNames.includes('createdAt'), 'User must have "createdAt" field');
    assert.ok(fieldNames.includes('updatedAt'), 'User must have "updatedAt" field');
  });

  it('should inspect fields of UserProfile type and verify inverse relation', async () => {
    const fieldsQuery = `
      query IntrospectProfileFields {
        __type(name: "UserProfile") {
          name
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    `;

    const result = await graphql(schema, fieldsQuery);
    assert.ok(result.data.__type, 'UserProfile type must be introspectable');
    const fieldNames = result.data.__type.fields.map((f) => f.name);

    assert.ok(fieldNames.includes('id'), 'UserProfile must have "id" field');
    assert.ok(fieldNames.includes('user'), 'UserProfile must have "user" relational field');
    assert.ok(fieldNames.includes('headline'), 'UserProfile must have "headline" field');
    assert.ok(fieldNames.includes('bio'), 'UserProfile must have "bio" field');
    assert.ok(fieldNames.includes('website'), 'UserProfile must have "website" field');
    assert.ok(fieldNames.includes('skills'), 'UserProfile must have "skills" field');
  });
});
