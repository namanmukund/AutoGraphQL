/* eslint-disable no-await-in-loop */
import { get } from 'lodash';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

const getBatchSessionAggregation = ({ batchIds = [] }) => [
  {
    $match: {
      'batch.typeId': {
        $in: batchIds,
      },
      sessionStatus: {
        $in: ['completed'],
      },
    },
  },
  {
    $lookup: {
      from: 'Batch',
      let: {
        batchId: '$batch.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$batchId',
              ],
            },
          },
        },
        {
          $project: {
            id: 1,
          },
        },
      ],
      as: 'batch',
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
      batch: {
        $arrayElemAt: ['$batch', 0],
      },
    },
  },
];

const getBatchAggregation = ({ batchIds = [] }) => [
  {
    $match: {
      id: {
        $in: batchIds,
      },
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

const transformMongoResults = (batchSessions, batchDetail) => {
  const coursePackageTopics = get(batchDetail, 'coursePackage.topics', []);
  let sessionProgress = 0;
  let averageAttendance = 0;
  if (batchSessions && batchSessions.length && coursePackageTopics) {
    sessionProgress = Math.round((batchSessions.length / coursePackageTopics.length) * 100);
    let overallPresentStudents = 0;
    let totalStudents = 0;
    batchSessions.forEach((session) => {
      const presentStudentsCount = get(session, 'attendance', []).filter((el) => get(el, 'status') === 'present').length;
      overallPresentStudents += presentStudentsCount;
      totalStudents += get(session, 'attendance', []).length;
    });
    averageAttendance = overallPresentStudents > 0 ? Math.round((overallPresentStudents / totalStudents) * 100) : 0;
  }
  const returnedObj = {
    id: get(batchDetail, 'id'),
    code: get(batchDetail, 'code'),
    classroomTitle: get(batchDetail, 'classroomTitle', ''),
    totalStudents: get(batchDetail, 'students', []).length,
    sessionProgress,
    averageAttendance,
  };
  return returnedObj;
};

const getClassroomDetailsData = (batchesData = [], batchSessionsData = []) => {
  const classDetailsData = [];
  if (batchesData.length) {
    batchesData.forEach((batch) => {
      const batchSessionsRes = batchSessionsData.filter((batchSession) => get(batchSession, 'batch.id') === get(batch, 'id'));
      classDetailsData.push(transformMongoResults(batchSessionsRes, batch));
    });
  }
  return classDetailsData;
};

const getClassroomDetails = async (root, params, context) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }
  const batchIds = get(params, 'batchIds');
  if (!batchIds || !batchIds.length) {
    throw new MissingMandatoryInputInRequestError();
  }

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  const batchModel = getTypeQueryController('Batch', authentication);

  // eslint-disable-next-line no-restricted-syntax
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      batchIds,
    }),
  );
  const batchnRes = await batchModel.aggregate(
    getBatchAggregation({
      batchIds,
    }),
  );
  return getClassroomDetailsData(batchnRes, batchSessionRes);
};

export default getClassroomDetails;
