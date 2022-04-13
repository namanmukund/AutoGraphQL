import { get } from 'lodash';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

const getBatchSessionAggregation = ({
  batchId,
}) => [
  {
    $match: {
      'batch.typeId': batchId,
    },
  },
  {
    $project: {
      id: 1,
      bookingDate: 1,
      sessionStartDate: 1,
      sessionEndDate: 1,
      sessionStatus: 1,
      topic: 1,
      attendance: 1,
    },
  },
];

const getBatchAggregation = ({ batchId }) => [
  {
    $match: {
      id: batchId,
    },
  },
  {
    $lookup: {
      from: 'CoursePackage',
      let: { coursePackageId: '$coursePackage.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$coursePackageId'],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            title: 1,
            topics: 1,
          },
        },
      ],
      as: 'coursePackage',
    },
  },
  {
    $project: {
      id: 1,
      code: 1,
      classroomTitle: 1,
      course: 1,
      students: 1,
      coursePackage: {
        $arrayElemAt: ['$coursePackage', 0],
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

const transformMongoResults = (batchSessions, batch) => {
  const batchDetail = batch[0] || {};
  const coursePackageTopics = get(batchDetail, 'coursePackage.topics', []);
  let sessionProgress = 0;
  let averageAttendance = 0;
  if (batchSessions && batchSessions.length && coursePackageTopics) {
    sessionProgress = (batchSessions.length / coursePackageTopics.length) * 100;
    const overallPresentStudents = 0;
    const totalStudents = 0;
    batchSessions.forEach(session => {
      let presentStudentsCount = get(session, 'attendance', []).filter(el => get(el, 'status') === 'present').length;
      overallPresentStudents += presentStudentsCount;
      totalStudents += get(session, 'attendance', []).length;
    })
    averageAttendance = (overallPresentStudents / totalStudents) * 100;
  }
  const returnedObj = {
    id: get(batchDetail, 'id'),
    code: get(batchDetail, 'code'),
    classroomTitle: get(batchDetail, 'classroomTitle', ''),
    totalStudents: get(batchDetail, 'students', []).length, 
    sessionProgress,
    averageAttendance
  };
  return returnedObj;
};

const getClassroomDetails = (async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }
  const batchIds = get(params, 'batchIds');
  if (!batchId || !batchIds.length) {
    throw new MissingMandatoryInputInRequestError();
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  const batchModel = getTypeQueryController(
    'Batch',
    authentication,
  );

  const transformedRes = [];
  batchIds.forEach(async (batchId) => {
    /**
     * Aggregation Queries for batchSession & adhocSessions
     */
    const batchSessionRes = await batchSessionModel.aggregate(
      getBatchSessionAggregation({
        batchId,
      }),
    );
  
    const batchnRes = await batchModel.aggregate(
      getBatchAggregation({
        batchId,
      }),
    );
  
    transformedRes.push(transformMongoResults(
      batchSessionRes,
      batchnRes,
    ));
  })
  return transformedRes;
});

export default getClassroomDetails;
