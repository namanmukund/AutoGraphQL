import { get } from 'lodash';
import { MutationController, RemoteController } from '../../../controllers';
import {
  callPrehooksForRelationsAddedInRecord,
} from '../utils/callPrehooksForRelationsAddedInRecord';
import { generateCuid, toObject, isErrorThrown } from '../../../../../../utils';
import { getFieldsBeingFetched, filterRemoteFields, filterRemoteInput } from '../../../../utils';
import { validate } from '../../../validation';
import { operationName } from '../../../../../../constants';
import { mergeMutationsPromisesResults } from '../utils/mergeMutationsPromisesResults';
import { getRelationFields } from '../utils/getRelationFields';
import { processRelationInputFields } from '../utils/processRelationInputFields';
import { saveRecordReferenceInRelatedObjects } from '../utils/saveRecordReferenceInRelatedObjects';
import { createAndReturnRelationObjectsPromiseArray } from '../utils/createAndReturnRelationObjectsPromiseArray';
import { filterLocalInputForMutation } from '../utils/filterLocalInputForMutation';
import { getConnectInputFieldsMap } from '../utils/getConnectInputFieldsMap';
import { rollBackDocumentSaves } from '../utils/rollBackDocumentSaves';
import relationDirections from '../../../../../../constants/relations';

const updateInputInCaseOfNestedConnect = (
  ast,
  typeName,
  inputFieldName,
  modifiedInput,
  arrayObjects,
  targetObj,
  mappingInfo,
) => {
  // mappingInfo to store unique mapping inside nested key
  Object.keys(targetObj).forEach((key) => {
    if (key && key.includes('ConnectId')) {
      // question
      const nestedFieldName = key.split('ConnectId')[0];
      if (!mappingInfo[nestedFieldName]) {
        // PQAttemptedQuestion
        const nestedFieldDataType = ast[typeName].field[inputFieldName].type.dataType;
        // info like type or directive
        const nestedFieldInfo = ast[nestedFieldDataType].field[nestedFieldName];
        // QuestionBank
        const nestedFieldNameRelatedTypeName = nestedFieldInfo.type.dataType;
        // direction
        const relationInfo = nestedFieldInfo.directive.relation.argument;
        const relationName = relationInfo.name.value.value;
        const direction = get(relationInfo, 'direction.value.value', relationDirections.twoWay);
        // update mappingInfo so that it can be uniquely used
        Object.assign(mappingInfo, {
          [nestedFieldName]: {
            nestedFieldDataType,
            nestedFieldNameRelatedTypeName,
            relationName,
            direction,
          },
        });
      }
      // to maintain the current structure of 1to1 and 1toM
      arrayObjects.push({
        typeId: targetObj[key],
        type: mappingInfo[nestedFieldName].nestedFieldNameRelatedTypeName,
        recordType: typeName,
        field: nestedFieldName,
        relationName: mappingInfo[nestedFieldName].relationName,
        direction: mappingInfo[nestedFieldName].direction,
      });
      // to update input with the required data
      Object.assign(modifiedInput, {
        [nestedFieldName]: {
          typeId: targetObj[key],
          type: mappingInfo[nestedFieldName].nestedFieldNameRelatedTypeName,
        },
      });
    } else {
      Object.assign(modifiedInput, { [key]: targetObj[key] });
    }
  });
  return null;
};


const nestedConnectIdHandler = (
  ast,
  typeName,
  input,
) => {
  const finalInput = Object.assign({}, input);
  const allRelationObjectsArray1to1Data = [];
  const allRelationObjectsArray1toMData = [];
  Object.keys(finalInput).forEach((inputFieldName) => {
    if (
      Array.isArray(finalInput[inputFieldName]) &&
        finalInput[inputFieldName].length
    ) {
      const typeTypeIdArray = [];
      const arrayObjects = [];
      const mappingInfo = {};
      finalInput[inputFieldName].forEach((doc) => {
        const modifiedInput = {};
        updateInputInCaseOfNestedConnect(
          ast,
          typeName,
          inputFieldName,
          modifiedInput,
          arrayObjects,
          doc,
          mappingInfo,
        );
        typeTypeIdArray.push(modifiedInput);
      });
      //
      allRelationObjectsArray1toMData.push(arrayObjects);
      finalInput[inputFieldName] = typeTypeIdArray;
    } else if (typeof finalInput[inputFieldName] === 'object') {
      const modifiedInput = {};
      const mappingInfo = {};
      const arrayObjects = [];
      updateInputInCaseOfNestedConnect(
        ast,
        typeName,
        inputFieldName,
        modifiedInput,
        arrayObjects,
        finalInput[inputFieldName],
        mappingInfo,
      );
      finalInput[inputFieldName] = modifiedInput;
      Object.assign(allRelationObjectsArray1to1Data, [...arrayObjects]);
    }
  });

  return {
    finalInput,
    allRelationObjectsArray1to1Data,
    allRelationObjectsArray1toMData,
  };
};


// Returns remote delete mutation promises.
const remoteAddMutationPromises = (
  id,
  input,
  typeName,
  fieldsFetched,
  mutationName,
  controllerFunctionName,
  remoteFieldsApplicationWise,
  authentication,
  ast,
) => {
  // Loop through all applicaiton fields to delete.
  const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
    const appFieldsToMutate = filterRemoteFields(
      typeName,
      appApplicationName,
      ast,
      fieldsFetched,
    );
    // Check if input has remote relation fields.
    // const remoteRelationFields = ast[typeName].remoteRelationFields;
    const appModelRemote = new RemoteController(appApplicationName, authentication);
    const appInputCore = Object.assign(
      {},
      filterRemoteInput(
        typeName,
        appApplicationName,
        ast,
        input,
      ),
      { id },
    );
    // Mutate remote applications.
    return appModelRemote[controllerFunctionName](
      typeName,
      mutationName,
      appInputCore,
      appFieldsToMutate,
    )
      .then((appResultRemote) => {
        const appData = appResultRemote.data;
        const appErrors = appResultRemote.errors;
        if (appErrors) {
          throw new Error(JSON.stringify(appErrors));
        }
        return appData[mutationName];
      });
  });
  return promiseArray;
};

// Roll back the changes made by addMutationResolver
// @TODO Rollback ending into loop if there are errors in rollback.
const rollBack = (
  // id,
  // typeName,
  // authentication,,
  // remoteFieldsApplicationWise,
) => {
  // const modelMutations = new MutationController(typeName, authentication);
  // // Delete from local
  // modelMutations.deleteDocument(id).then(result => result)
  //   .catch(error => error);
  // // Loop through all applicaiton fields to insert.
  // Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
  //   const appFieldsToMutatue =
  //     Object.assign({}, remoteFieldsApplicationWise[appApplicationName]);
  //   const appModelRemote = new RemoteController(appApplicationName);
  //   // Undo the previous remote event.
  //   appModelRemote.deleteMutation(typeName, id, appFieldsToMutatue)
  //     .catch(error => error);
  //   return null;
  // });
};
/*
typeName: "UserActivityDump"
connectInputFieldsMap: {
  "user": "cjj0zpybo00001f0ckk9zrpxr",
  "topic": "cjss0o4wo00011h03blrjmn2p"
}
input: {
  "type": "video",
  "learningObjective": {
    "order": 3,
    "title": "test"
  },
  "currentVideoTime": 19000,
  "id": "cjst9lcnt0000gcruxuo2g9te"
}
 */

const localAddMutationPromise = async (
  typeName,
  input,
  connectInputFieldsMap,
  ast,
  authentication,
  context,
) => {
  const modelMutations = new MutationController(typeName, authentication);
  // get fields from input which have relation directive
  /*
    relationFieldsArray: [
    {
      "fieldName": "learningObjective",
      "fieldType": {
        "dataType": "LearningObjective"
      },
      "fieldValue": {
        "order": 3,
        "title": "test"
      },
      "relationName": "LearningObjectiveDump"
    }
  ]
   */

  const {
    finalInput: modifiedInput,
    allRelationObjectsArray1to1Data,
    allRelationObjectsArray1toMData,
  } = nestedConnectIdHandler(
    ast,
    typeName,
    input,
  );
  if (modifiedInput) {
    Object.assign(input, modifiedInput);
  }

  const relationFieldsArray = getRelationFields(input, ast, typeName);
  /* eslint-disable no-param-reassign */
  context.mutationOrQueryName = `add${typeName}`;
  /* eslint-enabke no-param-reassign */
  /*  if fields found with relations or connect args present,
  create relation document & return relation type object */
  if ((relationFieldsArray && relationFieldsArray.length) ||
    Object.keys(connectInputFieldsMap).length) {
    const promiseArray = createAndReturnRelationObjectsPromiseArray(
      relationFieldsArray,
      typeName,
      ast,
      authentication,
      context,
    );
    // processes promise array and return final input
    /*
    inputMap: {
    "finalInput": {
      "type": "video",
      "learningObjective": {
        "type": "LearningObjective",
        "typeId": "cjst9qqpb0001gcrunbi90iot"
      },
      "currentVideoTime": 19000,
      "id": "cjst9lcnt0000gcruxuo2g9te",
      "user": {
        "type": "User",
        "typeId": "cjj0zpybo00001f0ckk9zrpxr"
      },
      "topic": {
        "type": "Topic",
        "typeId": "cjss0o4wo00011h03blrjmn2p"
      }
    },
    "allRelationObjectsArray1to1": [
      {
        "type": "LearningObjective",
        "recordType": "UserActivityDump",
        "typeId": "cjst9qqpb0001gcrunbi90iot",
        "field": "learningObjective",
        "relationName": "LearningObjectiveDump",
        "additionalRelationFieldsObject": {}
      },
      {
        "type": "User",
        "recordType": "UserActivityDump",
        "typeId": "cjj0zpybo00001f0ckk9zrpxr",
        "field": "user",
        "relationName": "UserDump"
      },
      {
        "type": "Topic",
        "recordType": "UserActivityDump",
        "typeId": "cjss0o4wo00011h03blrjmn2p",
        "field": "topic",
        "relationName": "TopicDump"
      }
    ],
    "allRelationObjectsArray1toM": [],
    "allSavedRelationRecords": [
      {
        "type": "LearningObjective",
        "recordType": "UserActivityDump",
        "typeId": "cjst9qqpb0001gcrunbi90iot",
        "field": "learningObjective",
        "relationName": "LearningObjectiveDump",
        "additionalRelationFieldsObject": {}
      }
    ]
    }
     */
    let inputMap;
    try {
      inputMap = await processRelationInputFields(
        promiseArray,
        typeName,
        input,
        ast,
        connectInputFieldsMap,
        null,
        authentication,
        allRelationObjectsArray1to1Data,
        allRelationObjectsArray1toMData,
      );
      // if error return error
      if (isErrorThrown(inputMap)) {
        return inputMap;
      }
    } catch (err) {
      throw err;
    }
    // call connection prehooks for all relations added in the record
    const mutationType = 'add';
    await callPrehooksForRelationsAddedInRecord(
      inputMap,
      input.id,
      mutationType,
      ast,
      context,
    );
    const {
      finalInput,
      allRelationObjectsArray1to1,
      allRelationObjectsArray1toM,
      allSavedRelationRecords,
    } = inputMap;
    return modelMutations.addDocument(finalInput)
      .then((savedRecord) => {
        /*
        savedRecord: {
            "currentMessage": {},
            "_id": "5c7c22550844edc2acad4566",
            "type": "video",
            "learningObjective": {
              "type": "LearningObjective",
              "typeId": "cjst9qqpb0001gcrunbi90iot"
            },
            "currentVideoTime": 19000,
            "id": "cjst9lcnt0000gcruxuo2g9te",
            "user": {
              "type": "User",
              "typeId": "cjj0zpybo00001f0ckk9zrpxr"
            },
            "topic": {
              "type": "Topic",
              "typeId": "cjss0o4wo00011h03blrjmn2p"
            },
            "pqAttemptedQuestions": [],
            "quizAttemptedQuestions": [],
            "createdAt": "2019-03-03T18:52:05.639Z",
            "updatedAt": "2019-03-03T18:52:05.639Z",
            "__v": 0
          }
         */
        // TODO: add save additional fields logic in saved related records
        const savedObject = { type: typeName, typeId: savedRecord.id };
        /*
        savedObject: {
              "type": "UserActivityDump",
              "typeId": "cjst9lcnt0000gcruxuo2g9te"
            }
         */
        allSavedRelationRecords.push(savedObject);
        return saveRecordReferenceInRelatedObjects(
          allRelationObjectsArray1to1,
          allRelationObjectsArray1toM,
          savedRecord,
          ast,
          authentication,
        ).then(() => savedRecord);
      }).catch((err) => {
        rollBackDocumentSaves(
          allSavedRelationRecords,
          authentication,
        );
        return err;
      });
  }
  return modelMutations.addDocument(input);
};

const addMutationResolver = (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
  context,
) => {
  // Fields which are requested.
  const { input, ...connectArguments } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  // const fields = ast[typeName].fields;
  const accessFields = ast[typeName];
  validate(operationName.add, accessFields, fieldsFetched, authentication, input);
  // get a map of connect arguments with field names as key and array of ids as value
  const connectInputFieldsMap = getConnectInputFieldsMap(connectArguments);
  const { remoteFields, remoteFieldsApplicationWise } = ast[typeName];
  // Create a new object id if there is no id.

  const cuidInput = generateCuid(input);
  const id = cuidInput.id;
  // @TODO incorporate relation logic with multi apps logic
  // If there are no remote fields, return the result.
  if (!Object.keys(remoteFields).length) {
    return localAddMutationPromise(
      typeName,
      cuidInput,
      connectInputFieldsMap,
      ast,
      authentication,
      context,
    );
  }
  const controllerFunctionName = 'addMutation';
  const promiseArray = remoteAddMutationPromises(
    id,
    input,
    typeName,
    fieldsFetched,
    mutationName,
    controllerFunctionName,
    remoteFieldsApplicationWise,
    authentication,
    ast,
  );
  // Wait for all mutations to resolve.
  return Promise.all(promiseArray)
    .then((values) => {
      const mergedValue = mergeMutationsPromisesResults(values);
      // Filter out values, when there are relation fields
      // remote mutation output.
      const localInput = filterLocalInputForMutation(
        typeName,
        cuidInput,
        mergedValue,
        ast,
      );
      // Input to local database.
      return localAddMutationPromise(
        typeName,
        localInput,
        connectInputFieldsMap,
        ast,
        authentication,
        context,
      ).then(result => mergeMutationsPromisesResults([mergedValue, toObject(result)]));
    })
    .catch((err) => {
      // Roll back in case of any error.
      rollBack(
        id,
        typeName,
        authentication,
        remoteFieldsApplicationWise,
      );
      return err;
    });
};
export default addMutationResolver;
