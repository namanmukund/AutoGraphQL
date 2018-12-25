import { MutationController, QueryController } from '../../../controllers';
import { defaultDeleteLimitValue } from '../../../../../../constants';
import { InvalidParamsError } from '../../../../../../constants/errors';
import { paginationValidationKeys } from '../../../controllers/QueryController/paginate';
import { checkAndDeleteReferences } from '../utils';

const deleteMultipleMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  let paramsData = params;
  // Validate param keys
  const validation = paginationValidationKeys(params);
  if (!validation) {
    throw new InvalidParamsError();
  }
  // Force delete limit
  if (paramsData.first != null) {
    if (paramsData.first < 0) {
      paramsData.first = 0;
    } else {
      paramsData.first =
        (paramsData.first > defaultDeleteLimitValue) ? defaultDeleteLimitValue : paramsData.first;
    }
  } else if (paramsData.last != null) {
    if (paramsData.last < 0) {
      paramsData.last = 0;
    } else {
      paramsData.last =
        (paramsData.last > defaultDeleteLimitValue) ? defaultDeleteLimitValue : paramsData.last;
    }
  } else {
    paramsData.first = defaultDeleteLimitValue;
  }
  // Fetch all records to be deleted by filter
  const modelQueries = new QueryController(typeName, authentication);
  let recordsData = await modelQueries.fetchMany(paramsData);
  if (typeName === 'File') {
    recordsData = recordsData.filter((record) => {
    // Check if usage count is zero before deleting file
      const { usageCount } = record;
      return !(usageCount != null && usageCount > 0);
    });
  }
  // Map all record ids to be deleted
  const idsToDelete = recordsData.map(record => record.id);
  // Get delete params
  paramsData = {
    filter: {
      id_in: idsToDelete,
    },
  };
  // Delete all records
  const modelMutations = new MutationController(typeName, authentication);
  await modelMutations.deleteMany(paramsData);
  // Delete local references and subsets
  const relationFields = ast[typeName].localRelationFields;
  const relationSubsetFields = ast[typeName].localSubsetFields;
  const relationFieldNames = Object.keys(relationFields);
  // if not relation fields present return;
  if (!relationFieldNames.length) {
    return recordsData;
  }
  return recordsData.map(record => checkAndDeleteReferences(typeName,
    ast,
    authentication,
    record,
    relationFields,
    relationSubsetFields));
};

export default deleteMultipleMutationResolver;
