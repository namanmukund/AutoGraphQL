/*
  Auto generating mongoose model
 */
import mongoose from 'mongoose';
import { has } from 'lodash';
import getParsedASTMap from './../utils/getParsedASTMap';
import { log, types } from '../../../utils';
import RollbackSchema from '../../mongooseRollback/models/rollback';
import getDirectiveArgumentValue from '../utils/getDirectiveArgumentValue';
import { getEnumTypeSchema, visitField, hasDirective, getEnumDefinitionTypeObject } from '../utils';

const rollback = require('../../mongooseRollback/mongooseRollback');

const Schema = mongoose.Schema;
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

  const isRelationFieldWithAdditionalRelationFields = fieldDefinitionObject &&
      fieldDefinitionObject.typeId &&
      Object.keys(fieldDefinitionObject).length > 2;

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
    const enumInfo = getEnumTypeSchema(fieldDefinitionObject, enumArray);
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

const createMongooseModelsFromSchema = (allModelsSchema, typesSchema, modelsToBeVersioned) => {
  /* Schemas can be like
   user:{
      "username": {
          "type": "String",
          "required": true,
          "unique": true
       }
     }
   */
  const schemas = Object.assign({}, allModelsSchema);
  // get all the enum types before attaching it with the respective schemas
  const allEnumTypesObject = getEnumDefinitionTypeObject(types);
  const models = {};
  Object.keys(schemas).forEach((modelName) => {
    const typeName = modelName;
    const isModelToBeVersioned = !!modelsToBeVersioned.includes(typeName);
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

    // create history model if model versioning has to be done
    if (isModelToBeVersioned) {
      const historyCollectionName = `${typeName}_hist`;
      const historyCollectionObject = Object.assign(collectionObject,
        { collection: historyCollectionName });
      const historyModelSchema = new Schema(RollbackSchema, historyCollectionObject);

      const createdHistoryModel = mongoose.model(historyCollectionName,
        historyModelSchema, historyCollectionName);
      modelSchema.plugin(rollback, { collectionName: modelName,
        mongooseModel: createdHistoryModel });
      const historyTypeName = `${typeName}History`;
      models[historyTypeName] = createdHistoryModel;
    }
    // create model from schema
    const createdModel = mongoose.model(typeName, modelSchema);
    models[modelName] = createdModel;
  });
  return models;
};

// starts from here
const parsedASTMap = getParsedASTMap(types);

const modelTypesSchema = {};
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
        if (isDefaultField) {
          fieldObject.fieldModelDefinition.default = getDirectiveArgumentValue(
            parsedASTMap, typeName, fieldDefinition.name.value, 'defaultValue', 'value');
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
  const isModelVersioningToBeDone = directives && hasDirective(directives, 'history');
  if (isModel) {
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
  modelsToBeVersioned,
);
if (models) {
  Object.keys(models).forEach((model) => {
    log(`Mongoose Model generated for: ${model}`);
  });
}

export default models;

