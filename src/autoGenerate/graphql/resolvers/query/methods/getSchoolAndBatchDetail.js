import { get } from 'lodash';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { QueryController } from '../../../controllers';

const getBatchAggregation = ({
  batchId, schoolId,
}) => [
  {
    $match: {
      id: batchId,
      'school.typeId': schoolId,
    },
  },
  {
    $lookup: {
      from: 'SchoolClass',
      localField: 'classes.typeId',
      foreignField: 'id',
      as: 'classes',
    },
  },
  {
    $project: {
      id: 1,
      classes: {
        id: 1,
        grade: 1,
        section: 1,
      },
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const batchModel = getTypeQueryController(
  'Batch',
);

// this API will return basic school details
const getSchoolAndBatchDetail = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { schoolId, batchId } = params;
  // this will be sent in output

  if (!schoolId || !batchId) {
    throw new MissingMandatoryInputInRequestError();
  }

  const batchData = await batchModel.aggregate(
    getBatchAggregation({
      batchId, schoolId,
    }),
  );
  if (!batchData.length) {
    throw new DatabaseRecordNotFoundError();
  }
  const batchClasses = get(batchData, '[0].classes', []);
  const result = {
    batchId,
    schoolId,
    batchClasses: batchClasses.map((batchClass) => ({ grade: get(batchClass, 'grade'), section: get(batchClass, 'section') })),
  };
  return result;
});

export default getSchoolAndBatchDetail;
