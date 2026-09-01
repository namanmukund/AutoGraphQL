import {
  isObjectType,
  isInputObjectType,
  isNonNullType,
  isListType,
  GraphQLSchema,
} from 'graphql';

/**
 * Converts a GraphQL type to a TypeScript type string.
 *
 * @param {import('graphql').GraphQLType} type
 * @returns {{ tsType: string, isRequired: boolean }}
 */
const convertGraphQLTypeToTS = (type) => {
  let currentType = type;
  let isRequired = false;

  if (isNonNullType(currentType)) {
    isRequired = true;
    currentType = currentType.ofType;
  }

  let isArray = false;
  if (isListType(currentType)) {
    isArray = true;
    currentType = currentType.ofType;
    if (isNonNullType(currentType)) {
      currentType = currentType.ofType;
    }
  }

  let baseType = 'string';
  const typeName = currentType.name;

  switch (typeName) {
    case 'ID':
    case 'String':
      baseType = 'string';
      break;
    case 'Int':
    case 'Float':
      baseType = 'number';
      break;
    case 'Boolean':
      baseType = 'boolean';
      break;
    case 'Date':
      baseType = 'string | Date';
      break;
    default:
      baseType = typeName || 'Record<string, any>';
      break;
  }

  const tsType = isArray ? `Array<${baseType}>` : baseType;
  return { tsType, isRequired };
};

/**
 * Generates TypeScript SDK definitions from an executable GraphQL schema.
 *
 * @param {GraphQLSchema} schema - Executable GraphQL schema
 * @param {Object} [options]
 * @param {string} [options.clientName='AutoGraphQLClient']
 * @returns {string} TypeScript source code
 */
export const generateTypeScriptSDK = (schema, { clientName = 'AutoGraphQLClient' } = {}) => {
  const typeMap = schema.getTypeMap();
  const output = [];

  output.push('/**');
  output.push(' * AutoGraphQL Generated TypeScript SDK & Client');
  output.push(` * Generated at: ${new Date().toISOString()}`);
  output.push(' * DO NOT EDIT MANUALLY - Use "npm run codegen:sdk" to regenerate.');
  output.push(' */');
  output.push('');
  output.push('export interface ClientOptions {');
  output.push('  endpoint: string;');
  output.push('  token?: string;');
  output.push('  headers?: Record<string, string>;');
  output.push('  fetch?: any;');
  output.push('}');
  output.push('');
  output.push('export interface GraphQLResponse<T = any> {');
  output.push('  data?: T;');
  output.push('  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;');
  output.push('}');
  output.push('');

  // Collect business entity models (User, UserProfile, Post, etc.)
  const entityNames = [];
  const systemPrefixes = ['__', 'Query', 'Mutation', 'Subscription'];

  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];
    if (!isObjectType(type)) return;
    if (systemPrefixes.some((p) => typeName.startsWith(p))) return;
    if (typeName.endsWith('Meta') || typeName.endsWith('GroupBy') || typeName.endsWith('Payload')) return;

    entityNames.push(typeName);

    output.push(`export interface ${typeName} {`);
    const fields = type.getFields();
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { tsType, isRequired } = convertGraphQLTypeToTS(field.type);
      const optionalFlag = isRequired ? '' : '?';
      output.push(`  ${fieldName}${optionalFlag}: ${tsType};`);
    });
    output.push('}');
    output.push('');
  });

  // Collect input types for filters and mutations
  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];
    if (!isInputObjectType(type)) return;
    if (typeName.startsWith('__')) return;

    output.push(`export interface ${typeName} {`);
    const fields = type.getFields();
    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const { tsType, isRequired } = convertGraphQLTypeToTS(field.type);
      const optionalFlag = isRequired ? '' : '?';
      output.push(`  ${fieldName}${optionalFlag}: ${tsType};`);
    });
    output.push('}');
    output.push('');
  });

  // Generate the AutoGraphQLClient class
  output.push(`export class ${clientName} {`);
  output.push('  private endpoint: string;');
  output.push('  private headers: Record<string, string>;');
  output.push('  private customFetch: any;');
  output.push('');
  output.push('  constructor(options: ClientOptions) {');
  output.push('    this.endpoint = options.endpoint;');
  output.push('    this.headers = {');
  output.push("      'Content-Type': 'application/json',");
  output.push("      'Accept': 'application/json',");
  output.push('      ...(options.headers || {}),');
  output.push('    };');
  output.push('    if (options.token) {');
  output.push("      this.headers['Authorization'] = `Bearer ${options.token}`;");
  output.push('    }');
  output.push("    this.customFetch = options.fetch || (typeof fetch !== 'undefined' ? fetch : null);");
  output.push('  }');
  output.push('');
  output.push('  async raw<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {');
  output.push('    if (!this.customFetch) {');
  output.push("      throw new Error('Fetch implementation is not available. Please pass fetch in ClientOptions.');");
  output.push('    }');
  output.push('    const res = await this.customFetch(this.endpoint, {');
  output.push("      method: 'POST',");
  output.push('      headers: this.headers,');
  output.push('      body: JSON.stringify({ query, variables }),');
  output.push('    });');
  output.push('    const json: GraphQLResponse<T> = await res.json();');
  output.push('    if (json.errors && json.errors.length > 0) {');
  output.push("      throw new Error(`GraphQL Error: ${json.errors.map(e => e.message).join(', ')}`);");
  output.push('    }');
  output.push('    return json.data as T;');
  output.push('  }');
  output.push('');

  // Generate typed namespaces for each entity
  entityNames.forEach((entity) => {
    const plural = `${entity.toLowerCase()}s`;
    const singular = entity.toLowerCase();

    output.push(`  get ${singular}() {`);
    output.push('    const client = this;');
    output.push('    return {');
    output.push(`      async findById(id: string, selection = 'id'): Promise<${entity} | null> {`);
    output.push(`        const query = \`query Get\${'${entity}'}($id: ID!) { ${singular}(id: $id) { \${selection} } }\`;`);
    output.push(`        const data = await client.raw<{ ${singular}: ${entity} }>(query, { id });`);
    output.push(`        return data ? data.${singular} : null;`);
    output.push('      },');
    output.push(`      async findMany(filter?: any, selection = 'id'): Promise<Array<${entity}>> {`);
    output.push(`        const query = \`query List\${'${entity}'}($filter: \${'${entity}'}Filter) { ${plural}(filter: $filter) { \${selection} } }\`;`);
    output.push(`        const data = await client.raw<{ ${plural}: Array<${entity}> }>(query, { filter });`);
    output.push(`        return data ? data.${plural} : [];`);
    output.push('      },');
    output.push(`      async create(input: any, selection = 'id'): Promise<${entity}> {`);
    output.push(`        const query = \`mutation Add\${'${entity}'}($input: add\${'${entity}'}Input!) { add${entity}(input: $input) { \${selection} } }\`;`);
    output.push(`        const data = await client.raw<{ add${entity}: ${entity} }>(query, { input });`);
    output.push(`        return data.add${entity};`);
    output.push('      },');
    output.push(`      async update(id: string, input: any, selection = 'id'): Promise<${entity}> {`);
    output.push(`        const query = \`mutation Update\${'${entity}'}($id: ID!, $input: update\${'${entity}'}Input!) { update${entity}(id: $id, input: $input) { \${selection} } }\`;`);
    output.push(`        const data = await client.raw<{ update${entity}: ${entity} }>(query, { id, input });`);
    output.push(`        return data.update${entity};`);
    output.push('      },');
    output.push(`      async delete(id: string): Promise<boolean> {`);
    output.push(`        const query = \`mutation Delete\${'${entity}'}($id: ID!) { delete${entity}(id: $id) { id } }\`;`);
    output.push(`        await client.raw(query, { id });`);
    output.push('        return true;');
    output.push('      },');
    output.push('    };');
    output.push('  }');
    output.push('');
  });

  output.push('}');
  output.push('');

  return output.join('\n');
};

export default {
  generateTypeScriptSDK,
};
