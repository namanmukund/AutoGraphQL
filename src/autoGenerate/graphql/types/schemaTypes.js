import schema from '../../../../config/graphqlSchema';
import getParsedASTMap from '../../utils/getParsedASTMap';
import updateSchemaWithDefaultFields from './updateSchemaWithDefaultFields';
import updateSchemaWithUserToken from './updateSchemaWithUserToken';
import updateSchemaWithAdditionalRelationalFields from './updateSchemaWithAdditionalRelationalFields';
import updateSchemaWithRelationalMetaFields from './updateSchemaWithRelationalMetaFields';
import updateSchemaWithParentChildToken from './updateSchemaWithParentChildToken';

// get schema types from config
const application = process.env.APPLICATION || 'core';
const graphqlTypes = schema[application].types;

// default fields
const updatedSchemaWithDefaultFields = updateSchemaWithDefaultFields(
  graphqlTypes,
);
// user token
const updatedSchemaWithUserToken = updateSchemaWithUserToken(
  updatedSchemaWithDefaultFields,
);

// additional relational fields
const parsedASTMapForAdditionalRelationalFields = getParsedASTMap(updatedSchemaWithUserToken);
const updatedSchemaWithAdditionalRelationalFields = updateSchemaWithAdditionalRelationalFields(
  parsedASTMapForAdditionalRelationalFields,
  updatedSchemaWithUserToken,
);
// relational meta fields
const parsedAstMapForRelationalMetaFields = getParsedASTMap(
  updatedSchemaWithAdditionalRelationalFields,
);
const updatedSchemaWithRelationalMetaFields = updateSchemaWithRelationalMetaFields(
  parsedAstMapForRelationalMetaFields,
  updatedSchemaWithAdditionalRelationalFields,
);

// parent child token
const updatedSchemaWithParentChildToken = updateSchemaWithParentChildToken(
  updatedSchemaWithRelationalMetaFields,
);

// export final schema
export default updatedSchemaWithParentChildToken;
