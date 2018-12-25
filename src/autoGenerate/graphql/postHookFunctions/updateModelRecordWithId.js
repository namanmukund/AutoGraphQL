import { MutationController } from '../controllers';

const updateModelRecordWithId = (typeName, recordId, updateObject) => {
  const campusMutationModel = new MutationController(typeName, { bypass: true });
  return campusMutationModel.updateOne({ id: recordId }, updateObject);
};

export default updateModelRecordWithId;
