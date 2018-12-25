/* file for autogenerating models */
import mongoose from 'mongoose';
import { has } from 'lodash';
import getParsedASTMap from './../utils/getParsedASTMap';
import getEnumDefinitionTypeObject from '../utils/getEnumDefinitionTypeObject';
import { log, types } from '../../../utils';
import RollbackSchema from '../../mongooseRollback/models/rollback';
import getDirectiveArgumentValue from '../utils/getDirectiveArgumentValue';
import hasDirective from '../utils/hasDirective';
import visitField from '../utils/visitField';
import getEnumTypeSchema from '../utils/getEnumTypeSchema';

const rollback = require('../../mongooseRollback/mongooseRollback');

const Schema = mongoose.Schema;
// recursive function, returns final field schema definition for each field in model
const getFieldSchema = (fieldDefinition, typesSchema, allModelsSchema, allEnumTypesObject) => {
  let finalFieldModelDefinition;
  const isFieldDefininitionArray = Array.isArray(fieldDefinition);
  const field = isFieldDefininitionArray ? fieldDefinition[0] : fieldDefinition;
  const fieldType = field.type;
  const isRelationFieldWithAdditionalRelationFields = field && field.typeId
    && Object.keys(field).length > 2;
  if (isRelationFieldWithAdditionalRelationFields) {
    // is relation field
    Object.keys(field).forEach((nestedField) => {
      const nestedFieldSchemaValue = field[nestedField];
      const nestedFieldType = Array.isArray(nestedFieldSchemaValue) ? field[nestedField][0].type
        : field[nestedField].type;
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
        field[nestedField] = Array.isArray(nestedFieldSchemaValue) ? [nestedFieldSchema]
          : nestedFieldSchema;
      }
    });
  }
  // check if field is enum type
  const isFieldEnumType = has(allEnumTypesObject, fieldType);
  if (isFieldEnumType) {
    const enumArray = allEnumTypesObject[fieldType].enum;
    const enumInfo = getEnumTypeSchema(field, enumArray);
    finalFieldModelDefinition = isFieldDefininitionArray ? [enumInfo] : enumInfo;
  } else if (typesSchema[fieldType]) {
    const nestedFieldSchema = typesSchema[fieldType];
    /*  call func again with all the inner fields
     replace field type def for all keys in field schema */
    Object.keys(nestedFieldSchema).forEach((nestedKey) => {
      const nestedfield = nestedFieldSchema[nestedKey];
      const schemaForNestedField = getFieldSchema(nestedfield, typesSchema,
        allModelsSchema, allEnumTypesObject);
      nestedFieldSchema[nestedKey] = schemaForNestedField;
    });
    finalFieldModelDefinition = isFieldDefininitionArray ? [nestedFieldSchema] : nestedFieldSchema;
  } else {
    finalFieldModelDefinition = fieldDefinition;
  }

  return finalFieldModelDefinition;
};

const createModelsFromSchema = (allModelsSchema, typesSchema, modelsToBeVersioned) => {
  const schemas = Object.assign({}, allModelsSchema);
  // get all the enum types before attaching it with the respective schemas
  const allEnumTypesObject = getEnumDefinitionTypeObject(types);
  const models = {};
  Object.keys(schemas).forEach((modelName) => {
    const typeName = modelName;
    const isModelToBeVersioned = !!modelsToBeVersioned.includes(typeName);
    const model = schemas[typeName];

    Object.keys(model).forEach((fieldName) => {
      const fieldSchema = getFieldSchema(model[fieldName], typesSchema,
        allModelsSchema, allEnumTypesObject);
      model[fieldName] = fieldSchema;
    });
    // make model from schemas
    /* using 'usePushEach : true' configuration in mongoose removes the error
    for the deprecated $pushAll method in mongodb version > 3.4.9  */
    const collectionObject = { collection: typeName, timestamps: true, usePushEach: true };
    const modelSchema = new Schema(model, collectionObject);

    // create history model is model versioning to be done
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
  const definition = parsedASTMap[type];
  const { name, field, directives } = definition;
  const typeName = name.value;
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
        // If fields is not remote and has defination.
        if (!isRemote && fieldModelDefinition) {
          objectSchema[fieldDefinition.name.value] = fieldModelDefinition;
        }
      }
    });
  }
  // model directives logic
  const isModel = directives && hasDirective(directives, 'model');
  const isModelVersioningToBeDone = directives && hasDirective(directives, 'history');
  if (isModel) {
    modelTypesSchema[typeName] = objectSchema;
  } else {
    embeddedTypesSchema[typeName] = objectSchema;
  }
  if (isModelVersioningToBeDone) {
    modelsToBeVersioned.push(typeName);
  }
  return null;
});
const models = createModelsFromSchema(modelTypesSchema, embeddedTypesSchema, modelsToBeVersioned);
if (models) {
  Object.keys(models).forEach((model) => {
    log(`Model generated: ${model}`);
  });
}

export default models;

