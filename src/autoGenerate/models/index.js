/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/*
  Auto generating models
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { has } from 'lodash';
import getParsedASTMap from '../utils/getParsedASTMap';
import { log, types } from '../../../utils';
import getDirectiveArgumentValue, { getTypeDirectiveArgumentValue } from '../utils/getDirectiveArgumentValue';
import {
  getEnumTypeMongooseSchema, visitField, hasDirective, getEnumDefinitionTypeObject,
} from '../utils';
import { DATABASE_DIALECTS, PG_MODEL_SUFFIX } from '../../../constants';

const basename = path.basename(__filename);

const { Schema } = mongoose;
// uncomment below code to debug mongodb queries
// mongoose.set('debug', true);
// recursive function, returns final field schema definition for each field in model
const getFieldSchema = (fieldDefinition, typesSchema, allModelsSchema, allEnumTypesObject) => {
  let finalFieldModelDefinition;
  const isFieldDefinitionArray = Array.isArray(fieldDefinition);
  /*
   Examples of fieldDefinitionObject
   -- { type: 'Number' }
   -- { type: 'ArrangeOption' }
   -- { groupByFieldValue: { type: 'String' }, count: { type: 'Number' } }
   -- { typeId: { type: 'String' }, type: { type: 'String' } }
    */
  const fieldDefinitionObject = isFieldDefinitionArray
    ? fieldDefinition[0]
    : fieldDefinition;
  const { type: fieldType } = fieldDefinitionObject;

  const isRelationFieldWithAdditionalRelationFields = fieldDefinitionObject
      && fieldDefinitionObject.typeId
      && Object.keys(fieldDefinitionObject).length > 2;

  if (isRelationFieldWithAdditionalRelationFields) {
    // is relation field
    Object.keys(fieldDefinitionObject).forEach((nestedField) => {
      const nestedFieldSchemaValue = fieldDefinitionObject[nestedField];
      const nestedFieldType = Array.isArray(nestedFieldSchemaValue)
        ? fieldDefinitionObject[nestedField][0].type
        : fieldDefinitionObject[nestedField].type;
      if (typesSchema[nestedFieldType]) {
        const nestedFieldSchema = typesSchema[nestedFieldType];
        /*  call func again with all the inner fields
         replace field type def for all keys in field schema */
        Object.keys(nestedFieldSchema).forEach((nestedKey) => {
          const nestedfield = nestedFieldSchema[nestedKey];
          const schemaForNestedField = getFieldSchema(nestedfield, typesSchema,
            allModelsSchema, allEnumTypesObject);
          nestedFieldSchema[nestedKey] = schemaForNestedField;
        });
        fieldDefinitionObject[nestedField] = Array.isArray(nestedFieldSchemaValue)
          ? [nestedFieldSchema]
          : nestedFieldSchema;
      }
    });
  }
  // check if field is enum type
  const isFieldEnumType = has(allEnumTypesObject, fieldType);
  if (isFieldEnumType) {
    /*
    enumArray contains enum fields like [active, inactive, blocked]
     */
    const enumArray = allEnumTypesObject[fieldType].enum;
    /*
    enumInfo contains enum with other mongoose info
    {
      "type": "String",
      "enum": [
        "inactive",
        "active",
        "blocked"
      ],
      "default": "inactive"
    }
     */
    const enumInfo = getEnumTypeMongooseSchema(fieldDefinitionObject, enumArray);
    finalFieldModelDefinition = isFieldDefinitionArray ? [enumInfo] : enumInfo;
  } else if (typesSchema[fieldType]) {
    /*
    typesSchema[fieldType] can be typesSchema[Phone] {
        "countryCode": {
          "type": "String"
        },
        "number": {
          "type": "String"
        }
      }
     */
    const nestedFieldSchema = typesSchema[fieldType];
    /*  call func again with all the inner fields
     replace field type def for all keys in field schema */
    Object.keys(nestedFieldSchema).forEach((nestedKey) => {
      const nestedfield = nestedFieldSchema[nestedKey];
      const schemaForNestedField = getFieldSchema(nestedfield, typesSchema,
        allModelsSchema, allEnumTypesObject);

      nestedFieldSchema[nestedKey] = schemaForNestedField;
    });
    finalFieldModelDefinition = isFieldDefinitionArray ? [nestedFieldSchema] : nestedFieldSchema;
  } else {
    finalFieldModelDefinition = fieldDefinition;
  }

  return finalFieldModelDefinition;
};

const createMongooseModelsFromSchema = (allModelsSchema, typesSchema) => {
  /* Schemas can be like
   user:{
      "username": {
          "type": "String",
          "required": true,
          "unique": true
       }
     }
   */
  const schemas = { ...allModelsSchema };
  // get all the enum types before attaching it with the respective schemas
  const allEnumTypesObject = getEnumDefinitionTypeObject(types);
  const mongooseModels = {};
  // Moongoose model creation
  Object.keys(schemas).forEach((modelName) => {
    const typeName = modelName;
    const model = schemas[typeName];

    Object.keys(model).forEach((fieldName) => {
      // Converting every field of a model into mongoose schema
      model[fieldName] = getFieldSchema(model[fieldName], typesSchema,
        allModelsSchema, allEnumTypesObject);
    });
    // make model from schemas
    /* using 'usePushEach : true' configuration in mongoose removes the error
    for the deprecated $pushAll method in mongodb version > 3.4.9  */
    const collectionObject = { collection: typeName, timestamps: true, usePushEach: true };
    const modelSchema = new Schema(model, collectionObject);

    // create model from schema
    const createdModel = mongoose.model(typeName, modelSchema);
    mongooseModels[modelName] = createdModel;
  });

  Object.keys(mongooseModels).forEach((model) => {
    log(`Mongoose Model generated for: ${model}`);
  });

  /**
   * @TODO Autogenerate SQL models from GraphQL schema
   * SQL model creation
   */

  // Generating SQL models from filesystem if any.
  const sqlModels = {};
  fs.readdirSync(__dirname)
    .filter((file) => (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-12) === PG_MODEL_SUFFIX
    ))
    .forEach((file) => {
      const model = require(path.join(__dirname, file)).default;
      sqlModels[model.name] = model;
    });

  Object.keys(sqlModels).forEach((model) => {
    log(`PG SQL Model generated for: ${model}`);
  });

  return { ...mongooseModels, ...sqlModels };
};

// starts from here
const parsedASTMap = getParsedASTMap(types);

const modelTypesSchema = {};
const sqlModelTypesSchema = {};
const embeddedTypesSchema = {};
const modelsToBeVersioned = [];
Object.keys(parsedASTMap).forEach((type) => {
  const graphqlTypeDefinition = parsedASTMap[type];
  /*
  Possible keys in graphqlTypeDefinition
  [ 'name',
  'interfaces',
  'directives',
  'loc',
  'fields',
  'field',
  'kind',
  'localFields',
  'relationFields',
  'localRelationFields',
  'localSubsetFields',
  'readOnlyFields',
  'writeOnlyFields',
  'defaultFields',
  'localUniqueFields',
  'localNonNullFields',
  'localNonNullAndUniqueFields',
  'remoteFields',
  'remoteRelationFields',
  'remoteFieldsApplicationWise',
  'remoteRelationFieldsApplicationWise',
  'remoteUniqueFieldsApplicationWise',
  'remoteNonNullFieldsApplicationWise',
  'remoteNonNullAndUniqueFieldsApplicationWise',
  'defaultFieldsWithValue',
  'additionalRelationFields' ]
   */
  const { name: { value: typeName }, field, directives } = graphqlTypeDefinition;
  const objectSchema = {};
  // model fields parse
  const fieldNamesArray = Object.keys(field);
  if (fieldNamesArray && fieldNamesArray.length) {
    fieldNamesArray.forEach((fieldName) => {
      const fieldDefinition = field[fieldName];
      const fieldObject = visitField(fieldDefinition, parsedASTMap, typeName);
      if (fieldObject) {
        const fieldDirectives = fieldDefinition.directive;
        const isRemote = fieldDirectives.remote;
        const isDefaultField = fieldDirectives.defaultValue;
        const isIndexedField = fieldDirectives.createIndex;
        if (isDefaultField) {
          fieldObject.fieldModelDefinition.default = getDirectiveArgumentValue(
            parsedASTMap, typeName, fieldDefinition.name.value, 'defaultValue', 'value',
          );
        }
        if (isIndexedField) {
          // TODO: assign default value as 1
          fieldObject.fieldModelDefinition.index = getDirectiveArgumentValue(
            parsedASTMap, typeName, fieldDefinition.name.value, 'createIndex', 'value',
          );
        }
        const { fieldModelDefinition } = fieldObject;
        // If fields is not remote and has definition.
        if (!isRemote && fieldModelDefinition) {
          objectSchema[fieldDefinition.name.value] = fieldModelDefinition;
        }
      }
    });
  }
  /*
  Possible objectSchema for User type
    {
    "status": {
      "type": "Status",
      "required": true,
      "default": "inactive"
    },
    "username": {
      "type": "String",
      "required": true,
      "unique": true
    },
    "phone": {
      "type": "Phone"
    },
  }
   */
  // model directives logic
  const isModel = directives && hasDirective(directives, 'model');
  const modelDatabase = getTypeDirectiveArgumentValue(directives, 'model', 'database');
  const isSQLModel = modelDatabase === DATABASE_DIALECTS.postgres;
  const isModelVersioningToBeDone = directives && hasDirective(directives, 'history');
  if (isSQLModel) {
    sqlModelTypesSchema[typeName] = objectSchema;
  } else if (isModel) {
    modelTypesSchema[typeName] = objectSchema;
  } else {
    /*
    Phone is an embedded type schema
     */
    embeddedTypesSchema[typeName] = objectSchema;
  }
  if (isModelVersioningToBeDone) {
    modelsToBeVersioned.push(typeName);
  }
  return null;
});
const models = createMongooseModelsFromSchema(
  modelTypesSchema,
  embeddedTypesSchema,
  sqlModelTypesSchema,
  modelsToBeVersioned,
);
export default models;
