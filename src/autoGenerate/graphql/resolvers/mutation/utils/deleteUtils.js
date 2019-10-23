/* eslint no-restricted-syntax: ["error", "FunctionExpression", "WithStatement",
"BinaryExpression[operator='in']"] */
import pluralize from 'pluralize';
import { MutationController, QueryController } from '../../../controllers';
import { findFieldWithTheRelation } from '../../../../utils';
import { toObject, formatToParamString } from '../../../../../../utils';
import updateAndDecreaseUsageCountInFile from './updateAndDecreaseUsageCountInFile';
import deleteFromS3 from '../../../../../middlewares/utils/deleteFromS3';
import callGraphqlApi from '../../../../../api/callGraphqlApi';

const deleteRecordReferences = async (relationFields, relationSubsetFields,
  schemaType, recordDocument, ast, authentication) => {
  const promiseArray = [];
  const relationKeys = Object.keys(relationFields);
  for (const fieldName of relationKeys) {
    const relatedType = ast[schemaType].field[fieldName].type.dataType;
    const relationName = relationFields[fieldName];
    // get typeIds in which reference has to be deleted
    const allRefereceTypeIds = [];
    const relationFieldValueInDeletedDocument = recordDocument[fieldName];
    // check if reference present
    if (relationFieldValueInDeletedDocument) {
      // validateReferncesEXistenceInField()
      if (Array.isArray(relationFieldValueInDeletedDocument)) {
      // for all references add typeId to allRefereceTypeIds array
        relationFieldValueInDeletedDocument.forEach((referenceObject) => {
          allRefereceTypeIds.push(referenceObject.typeId);
        });
      } else if (relationFieldValueInDeletedDocument
          && relationFieldValueInDeletedDocument.typeId) {
        const { type, typeId } = relationFieldValueInDeletedDocument;
        allRefereceTypeIds.push(typeId);
        if (type === 'File') {
          /* eslint-disable no-await-in-loop */
          await updateAndDecreaseUsageCountInFile(typeId, authentication);
          const relatedModelQuery = new QueryController('File', authentication);
          await relatedModelQuery.fetchById(typeId).then(async (file) => {
          /* eslint-enable no-await-in-loop */
            const { usageCount, uri } = file;
            if (usageCount === 0) {
              // remove file from db
              const modelMutation = new MutationController('File', authentication);
              await modelMutation.deleteDocument(typeId);
              // remove file from S3
              await deleteFromS3(uri);
            }
          });
        }
      }

      const relatedModellMutations = new MutationController(relatedType, authentication);
      // variable for field in related type with the relation
      const relationFieldName = findFieldWithTheRelation(relatedType, relationName, ast, fieldName);

      // relationFieldName won't exist for oneway relations
      if (relationFieldName) {
        // is relation field list
        const isFieldList = ast[relatedType].field[relationFieldName].type.isList;
        const updateObject = {};
        // find all documents with id in typeIds and update them
        const searchObject = { id: { $in: allRefereceTypeIds } };

        if (isFieldList) {
          // if list pull from relation field array
          updateObject.$pull = {};
          updateObject.$pull[relationFieldName] = { typeId: recordDocument.id };
        } else {
          // if not list set relation field to emtpy object
          updateObject.$set = {};
          updateObject.$set[relationFieldName] = {};
        }
        if (allRefereceTypeIds.length) {
          promiseArray.push(relatedModellMutations.update(searchObject, updateObject, true));
          // Subset cannot be there on many to one or many to many relations
          if (relationSubsetFields.includes(fieldName) && !isFieldList) {
            const typeIds = formatToParamString(allRefereceTypeIds);
            const deleteMutation = `mutation{
            delete${pluralize(relatedType)}(
            filter:{
              id_in:${typeIds}
            }
          ){
            id
          }
        }`;
            promiseArray.push(callGraphqlApi(deleteMutation));
          }
        }
      }
    }
  }
  return promiseArray;
};

// Check and delete references
const checkAndDeleteReferences = async (
  typeName,
  ast,
  authentication,
  record,
  relationFields,
  relationSubsetFields,
) => {
  const recordDocument = toObject(record);
  // delete record references in referenced types
  const deletePromisesArray = await deleteRecordReferences(relationFields,
    relationSubsetFields, typeName, recordDocument, ast, authentication);
  await Promise.all(deletePromisesArray).catch((err) => err);
  return record;
};

export default checkAndDeleteReferences;
