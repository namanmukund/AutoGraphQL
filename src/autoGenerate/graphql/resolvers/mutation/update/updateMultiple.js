import { MutationController, RemoteController } from '../../../controllers';
import {
    callPrehooksForRelationsAddedInRecord,
} from '../utils/callPrehooksForRelationsAddedInRecord';
import getArrayFieldsFromDocumentInput from '../utils/getArrayFieldsFromDocumentInput';
import { toObject, isErrorThrown } from '../../../../../../utils';
import { validate } from '../../../validation';
import { getFieldsBeingFetched, filterRemoteFields, filterRemoteInput } from '../../../../utils';
import { operationName } from '../../../../../../constants';
import { mergeMutationsPromisesResults } from '../utils/mergeMutationsPromisesResults';
import { getRelationFields } from '../utils/getRelationFields';
import { handleAdditionalFieldsToUpdate } from '../utils/handleAdditionalFieldsToUpdate';
import { processRelationInputFields } from '../utils/processRelationInputFields';
import { saveRecordReferenceInRelatedObjects } from '../utils/saveRecordReferenceInRelatedObjects';
import { createAndReturnRelationObjectsPromiseArray } from '../utils/createAndReturnRelationObjectsPromiseArray';
import { filterLocalInputForMutation } from '../utils/filterLocalInputForMutation';
import { getConnectInputFieldsMap } from '../utils/getConnectInputFieldsMap';
import { rollBackDocumentSaves } from '../utils/rollBackDocumentSaves';

// Returns remote delete mutation promises.
const remoteUpdateMutationPromises = (
    id,
    input,
    typeName,
    feildsFetched,
    mutationName,
    controllerFunctionName,
    remoteFieldsApplicationWise,
    authentication,
    ast,
) => {
    // Loop through all applicaiton fields to delete.
    const promiseArray = Object.keys(remoteFieldsApplicationWise).map((appApplicationName) => {
        const appFieldsToMutatue = filterRemoteFields(
            typeName,
            appApplicationName,
            ast,
            feildsFetched,
        );
        const appModelRemote = new RemoteController(appApplicationName, authentication);
        const appInput = filterRemoteInput(
            typeName,
            appApplicationName,
            ast,
            input,
        );

        // Mutate remote applications.
        return appModelRemote[controllerFunctionName](
            id,
            appInput,
            typeName,
            mutationName,
            appFieldsToMutatue,
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

// Roll back the changes made by updateMutationResolver
const rollBack = () => {
    // @TODO implement rollback for updateMutation.
};


const localUpdateMutationPromise = async (
    id,
    input,
    historyObject,
    typeName,
    connectInputFieldsMap,
    ast,
    authentication,
    context,
) => {
    const modelMutations = new MutationController(typeName, authentication);
    // get relation fields in input if existing
    const relationFieldsArray = getRelationFields(input, ast, typeName);
    /* eslint-disable no-param-reassign */
    context.mutationOrQueryName = `update${typeName}`;
    /* eslint-enabke no-param-reassign */
    /*  if fields found with relations or connect args present,
   create relation document & return relation type object */
    if ((relationFieldsArray && relationFieldsArray.length) ||
        Object.keys(connectInputFieldsMap).length) {
        const promiseArray = createAndReturnRelationObjectsPromiseArray(relationFieldsArray,
            typeName, ast, authentication, context);
        // get array of relation field names
        const relationFieldNamesArray = relationFieldsArray.map(obj => obj.fieldName);
        Object.keys(connectInputFieldsMap).forEach((field) => {
            relationFieldNamesArray.push(field);
        });
        // processes promise array and return final input
        const inputMap = await processRelationInputFields(promiseArray,
            typeName, input, ast, connectInputFieldsMap, id, authentication);

        if (isErrorThrown(inputMap)) {
            throw inputMap;
        }
        const { allRelationObjectsArray1to1,
            allRelationObjectsArray1toM, allSavedRelationRecords } = inputMap;
        let finalInput = inputMap.finalInput;
        // call connect prehooks for all relations added to the record
        const mutationType = 'update';
        await callPrehooksForRelationsAddedInRecord(inputMap, id, mutationType, ast, context);

        // handle additional relation fields sent in input
        const additionalFieldsToUpdateObject =
            handleAdditionalFieldsToUpdate(finalInput, ast, typeName);
        // arrayAdditionalFields: array relation fields
        const { relationAdditionalFieldsArray, arrayAdditionalFields } = additionalFieldsToUpdateObject;
        // update final input etc.
        finalInput = additionalFieldsToUpdateObject.finalInput;
        // add array input fields
        let arrayFieldsArray = getArrayFieldsFromDocumentInput(finalInput, ast, typeName);
        arrayFieldsArray = [...arrayFieldsArray,
            ...arrayAdditionalFields];
        return modelMutations
            .updateDocument(id, finalInput, relationFieldNamesArray,
                relationAdditionalFieldsArray, arrayFieldsArray, historyObject)
            .then(savedRecord => saveRecordReferenceInRelatedObjects(allRelationObjectsArray1to1,
                allRelationObjectsArray1toM,
                savedRecord,
                ast,
                authentication,
            ).then(() => savedRecord)).catch((err) => {
                rollBackDocumentSaves(allSavedRelationRecords, authentication);
                return err;
            });
    }
    const { finalInput, relationAdditionalFieldsArray, arrayAdditionalFields = [] } =
        handleAdditionalFieldsToUpdate(input, ast, typeName);
    const arrayFieldsArray = [...getArrayFieldsFromDocumentInput(finalInput, ast, typeName),
        ...arrayAdditionalFields];
    return modelMutations.updateDocument(id,
        finalInput, [], relationAdditionalFieldsArray, arrayFieldsArray, historyObject);
};

const updateMultipleMutationResolver = (
    root,
    params,
    typeName,
    info,
    mutationName,
    ast,
    authentication,
    context,
) => {
    const { id, history, ...connectArguments } = params;
    let input = params.input;
    if (!input) {
        input = {};
    }
    const { remoteFields, remoteFieldsApplicationWise } = ast[typeName];
    // Fields which are requested.
    const { fieldNodes } = info;
    const feildsFetched = getFieldsBeingFetched(fieldNodes);
    const fields = ast[typeName].fields;
    validate(operationName.update, fields, feildsFetched, authentication, input);
    // get a map of connect arguments with field names as key and array of ids as value
    const connectInputFieldsMap = getConnectInputFieldsMap(connectArguments);
    // If there are no remote fields, return the result.
    if (!Object.keys(remoteFields).length) {
        return localUpdateMutationPromise(
            id,
            input,
            history,
            typeName,
            connectInputFieldsMap,
            ast,
            authentication,
            context,
        );
    }
    // Loop through all applicaiton fields to delete.
    const controllerFunctionName = 'updateMutation';
    const promiseArray = remoteUpdateMutationPromises(
        id,
        input,
        typeName,
        feildsFetched,
        mutationName,
        controllerFunctionName,
        remoteFieldsApplicationWise,
        authentication,
        ast,
    );
    // Delete in local database.
    // promiseArray.push(
    //   modelMutations.updateDocument(id, input).then(result => toObject(result)),
    // );
    // Wait for all mutations to resolve.
    return Promise.all(promiseArray).then((values) => {
        const mergedValue = mergeMutationsPromisesResults(values);
        // Filter out values, when there are relation fields
        // remote mutation output.
        const localInput = filterLocalInputForMutation(
            typeName,
            input,
            mergedValue,
            ast,
        );
        // Input to local database.
        return localUpdateMutationPromise(
            id,
            localInput,
            typeName,
            connectInputFieldsMap,
            ast,
            authentication,
            context,
        ).then(result => mergeMutationsPromisesResults([mergedValue, toObject(result)]));
    })
        .catch((err) => {
            // Roll back in case of any error.
            rollBack();
            return err;
        });
};

export default updateMultipleMutationResolver;
