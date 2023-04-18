/*
import { get } from 'lodash';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { QueryController } from '../../../controllers';

const getBatchSessionAggregation = ({ batchId, topicId }) => [{
  $match: {
    'batch.typeId': batchId,
    'topic.typeId': topicId,
  },
}, {
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
        $lookup: {
          from: 'StudentProfile',
          let: {
            studentId: '$students.typeId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    '$id',
                    '$$studentId',
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'User',
                let: {
                  userId: '$user.typeId',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$id',
                          '$$userId',
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
                as: 'user',
              },
            },
            {
              $project: {
                id: 1,
                user: {
                  $arrayElemAt: [
                    '$user',
                    0,
                  ],
                },
              },
            },
          ],
          as: 'students',
        },
      },
      {
        $lookup: {
          from: 'StudentProfile',
          let: {
            batchstudentProfileId: {
              $ifNull: ['$batchStudents.typeId', []],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$id', '$$batchstudentProfileId'],
                },
              },
            },
            {
              $lookup: {
                from: 'User',
                let: {
                  userId: '$user.typeId',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          '$id',
                          '$$userId',
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
                as: 'user',
              },
            },
            {
              $project: {
                id: 1,
                user: {
                  $arrayElemAt: [
                    '$user',
                    0,
                  ],
                },
              },
            },
          ],
          as: 'batchStudents',
        },
      },
      {
        $project: {
          id: 1,
          students: 1,
          batchStudents: 1,
        },
      },
    ],
    as: 'batch',
  },
},
{
  $lookup: {
    from: 'Topic',
    localField: 'topic.typeId',
    foreignField: 'id',
    as: 'topic',
  },
},
{
  $project: {
    id: 1,
    batch: {
      $arrayElemAt: [
        '$batch',
        0,
      ],
    },
    topic: {
      $arrayElemAt: [
        '$topic',
        0,
      ],
    },
  },
},
];

const getVideoDataAggregation = ({ userIds, videoIds, topicId }) => [{
  $match: {
    'user.typeId': {
      $in: userIds || [],
    },
    'video.typeId': {
      $in: videoIds || [],
    },
    'topic.typeId': topicId,
  },
}];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const liveProgressData = async (params, authentication) => {
  // const authentication = ifAuthorized(context);

  // if (!(authentication && authentication.app && authentication.user)) {
  //   throw new UnauthorizedOperationError();
  // }

  const { batchId, topicId } = params;

  const batchSessionModel = getTypeQueryController(
    'BatchSession',
    authentication,
  );

  if (!(batchId && topicId)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Topic Id or Batch Id is missing in input.',
      },
    });
  }

  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      batchId,
      topicId,
    }),
  );
  if (!(batchSessionRes && batchSessionRes.length)) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'Topic Id or Batch Id passed is incorrect.',
      },
    });
  }
  const videoContent = []; const loComponentArray = []; const codingAssignmentArray = []; const
    practiceComponentArray = [];
  const batchSessionTopic = get(batchSessionRes, '[0].topic');
  Object.keys(batchSessionTopic).map((topic) => {
    if (topic === 'videoContent') {
      batchSessionTopic[topic].map((videoId) => videoContent.push(get(videoId, 'typeId')));
    }
    return;
  });
  getVideoDataAggregration()
  console.log('videoContent', videoContent);
};

export default liveProgressData;
*/
