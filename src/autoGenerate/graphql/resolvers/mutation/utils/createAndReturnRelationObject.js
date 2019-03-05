// returns a relation object with typeId and type after finding or creating the reference,
import { camelCase } from 'lodash';
import MutationController from '../../../controllers/MutationController';
import QueryController from '../../../controllers/QueryController';
import getUniqueFieldFromInput from '../../../../utils/getUniqueFieldFromInput';
import { isRelationDataValid } from './isRelationDataValid';
import { getAdditionalRelationFieldsFromRelationInput } from './getAdditionalRelationFieldsFromRelationInput';
import { generateCuid } from '../../../../../../utils';
import { prehook } from '../../../hooks';
import { getRelationObjectMap } from './getRelationObjectMap';

// { fieldName: 'learningObjective',
//   fieldType: { dataType: 'LearningObjective' },
//   fieldValue: { order: 23, title: 'fsfsfsdsdfsfs' },
//   relationName: 'LearningObjectiveDump' }

const createAndReturnRelationObject = async (
  fieldName,
  fieldValue,
  fieldType,
  relationName,
  typeName,
  ast,
  authentication,
  context,
) => {
  // Making dummy content here so that, hooks ignore that as this is nested mutation.
  const schemaType = fieldType.dataType;
  const mutationName = `add${schemaType}`;
  // Creating new authentication object
  const newAuthentication = Object.assign({}, authentication);
  // Sending mutationOrQueryName
  newAuthentication.mutationOrQueryName = mutationName;
  const relatedModelMutations = new MutationController(schemaType, newAuthentication);
  newAuthentication.mutationOrQueryName = `${camelCase(schemaType)}`;
  const relatedModelQueries = new QueryController(schemaType, newAuthentication);

  // get unique and required field from the input fields from ast
  const uniqueFieldForType = fieldType.isList
    ? getUniqueFieldFromInput(fieldValue[0], ast, schemaType)
    : getUniqueFieldFromInput(fieldValue, ast, schemaType);

  // Validate input data.
  try {
    await isRelationDataValid(fieldType, fieldValue, uniqueFieldForType,
      relatedModelQueries, ast, schemaType);
  } catch (err) {
    throw err;
  }
  // create referenced objects and get there ids
  if (fieldType.isList) {
    // create each relation object from db
    const promiseArray = fieldValue.map(async (value) => {
      // get additional fields from value
      const { additionalRelationFieldsObject, inputValue } =
        getAdditionalRelationFieldsFromRelationInput(value, ast, fieldName, typeName, relationName);
      // omit addtnl fields from input
      const cuidInput = generateCuid(inputValue);
      const valueToSave = await prehook(cuidInput, mutationName, context, { input: cuidInput });
      return relatedModelMutations.addDocument(valueToSave)
        .then(savedRecord =>
          ({ savedRecord, additionalRelationFieldsObject }));
    });
    return Promise.all(promiseArray)
      .then((values) => {
        // make relation object
        const relationArray = [];
        values.forEach((value) => {
          const { savedRecord, additionalRelationFieldsObject } = value;
          const typeId = savedRecord.id;
          if (typeId) {
            const relationObjectMap = getRelationObjectMap(schemaType, typeName, typeId,
              fieldName, relationName, additionalRelationFieldsObject);
            relationArray.push(relationObjectMap);
          }
        });
        return relationArray;
      })
      .catch(err => err);
  }
  // if field type is not array

  // get additional fields from value
  const { additionalRelationFieldsObject, inputValue } =
    getAdditionalRelationFieldsFromRelationInput(fieldValue, ast, fieldName,
      typeName, relationName);
  // Set id as input field.
  const cuidInput = generateCuid(inputValue);
  const valueToSave = await prehook(cuidInput, mutationName, context, { input: cuidInput });
  // create the relation document
  console.log('valueToSave................', valueToSave);
  return relatedModelMutations.addDocument(valueToSave)
    .then((savedObject) => {
      console.log('savedObject............', savedObject);
      if (typeof savedObject.id === 'undefined') {
        throw new Error(savedObject);
      }
      const typeId = savedObject.id;
      const relationObjectMap = getRelationObjectMap(schemaType, typeName, typeId,
        fieldName, relationName, additionalRelationFieldsObject);
      console.log('relationObjectMap............', relationObjectMap);
      /*
      relationObjectMap: { type: 'LearningObjective',
          recordType: 'UserActivityDump',
          typeId: 'cjsuwku5z00035lrueukyzb88',
          field: 'learningObjective',
          relationName: 'LearningObjectiveDump',
          additionalRelationFieldsObject: {} }
       */
      return relationObjectMap;
    })
    .catch(err => err);
};
export { createAndReturnRelationObject };
