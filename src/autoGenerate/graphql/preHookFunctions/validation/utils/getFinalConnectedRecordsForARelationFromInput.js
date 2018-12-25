/* from mutation params, recieves connectids & nested records to add and returns final array
 of all related records to the main type */
import { QueryController } from '../../../controllers';

const getFinalConnectedRecordsForARelationFromInput = async (relatedTypeName, connectIds,
  newRelatedRecordToConnect, existingConnectedRecords) => {
  // get camelcases plural query name from type
  const finalConnectedRecords = existingConnectedRecords;
  if (connectIds && connectIds.length) {
    const queryModel = new QueryController(relatedTypeName, { bypass: true });
    const fetchedRecords = await queryModel.fetchMultiple({ id: { $in: connectIds } });
    if (fetchedRecords && fetchedRecords.length) {
      finalConnectedRecords.push(...fetchedRecords);
    }
  }
  // if new students sent in input
  if (newRelatedRecordToConnect && newRelatedRecordToConnect.length) {
    // add then to profiles array
    finalConnectedRecords.push(...newRelatedRecordToConnect);
  }
  return finalConnectedRecords;
};

export default getFinalConnectedRecordsForARelationFromInput;
