import schema from '../../../../graphqlSchema';
import getParsedASTMap from '../../utils/getParsedASTMap';
import updateSchemaWithDefaultFields from './updateSchemaWithDefaultFields';
import updateSchemaWithAdditionalRelationalFields from './updateSchemaWithAdditionalRelationalFields';
import updateSchemaWithRelationalMetaFields from './updateSchemaWithRelationalMetaFields';
import { discoverAndLoadUserSchemas } from '../../utils/schemaAutoDiscovery';

// get schema types from config and auto-discover from root schemas/ folder
const application = process.env.APPLICATION || 'core';
const configuredTypes = (schema && schema[application] && schema[application].types) || [];
const userDiscoveredTypes = discoverAndLoadUserSchemas();
const graphqlTypes = [...configuredTypes, ...userDiscoveredTypes];

// 1. Inject default system fields (id, createdAt, updatedAt)
const updatedSchemaWithDefaultFields = updateSchemaWithDefaultFields(graphqlTypes);

// 2. Inject relational join fields
const parsedASTMapForAdditionalRelationalFields = getParsedASTMap(updatedSchemaWithDefaultFields);
const updatedSchemaWithAdditionalRelationalFields = updateSchemaWithAdditionalRelationalFields(
  parsedASTMapForAdditionalRelationalFields,
  updatedSchemaWithDefaultFields,
);

// 3. Inject relational aggregation/meta fields
const parsedAstMapForRelationalMetaFields = getParsedASTMap(
  updatedSchemaWithAdditionalRelationalFields,
);
const updatedSchemaWithRelationalMetaFields = updateSchemaWithRelationalMetaFields(
  parsedAstMapForRelationalMetaFields,
  updatedSchemaWithAdditionalRelationalFields,
);

// export pure schema types
export default updatedSchemaWithRelationalMetaFields;
