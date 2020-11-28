import { MutationController } from '../../../../controllers';

const updateSalesOperation = async (id, modifiedData) => {
  const modelMutations = new MutationController('SalesOperation', { bypass: true });
  const data = await modelMutations.updateOne({ id }, modifiedData);
  return data;
};

export default updateSalesOperation;
