import { filter, get, sortBy } from 'lodash';
import { slotTimes } from '../../../../../../constants';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { ifAuthorized } from '../../../../../../utils';
import { QueryController } from '../../../controllers';

const getSlotTimeFields = () => {
  const slotTimeObj = {};
  slotTimes.forEach((slotTime) => {
    slotTimeObj[`${slotTime}`] = 1;
  });
  return slotTimeObj;
};

const getBatchSessionAggregation = ({
  mentorId,
  startDate,
  endDate,
  filters,
}) => {
  return [
    {
      $match: {
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        sessionRecordingLink: 1,
        batch: 1,
        topic: 1,
        course: 1,
        mentorSession: 1,
        attendance: 1,
        ...getSlotTimeFields(),
      },
    },
    {
      $lookup: {
        from: "Batch",
        let: { batchId: "$batch.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$batchId"],
              },
            },
          },
          {
            $project: {
              code: 1,
              classroomTitle: 1,
              description: 1,
              school: 1,
              documentType: 1,
            },
          },
        ],
        as: "classroom",
      },
    },
    {
      $lookup: {
        from: "Topic",
        let: { topicId: "$topic.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$topicId"],
              },
            },
          },
          {
            $lookup: {
              from: "File",
              let: {
                thumbnailId: "$thumbnailSmall.typeId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$id", "$$thumbnailId"],
                    },
                  },
                },
                {
                  $project: {
                    id: 1,
                    uri: 1,
                    name: 1,
                  },
                },
              ],
              as: "thumbnailSmall",
            },
          },
          {
            $project: {
              id: 1,
              order: 1,
              title: 1,
              description: 1,
              thumbnailSmall: {
                $arrayElemAt: ["$thumbnailSmall", 0],
              },
            },
          },
        ],
        as: "topic",
      },
    },
    {
      $lookup: {
        from: "MentorSession",
        let: { mentorSessionId: "$mentorSession.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$mentorSessionId"],
              },
            },
          },
          {
            $lookup: {
              from: "User",
              let: { userId: "$user.typeId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$id", "$$userId"],
                    },
                  },
                },
              ],
              as: "mentorUser",
            },
          },
          {
            $project: {
              user: {
                $arrayElemAt: ["$mentorUser", 0],
              },
            },
          },
        ],
        as: "mentorSession",
      },
    },
    {
      $match: {
        "mentorSession.user.id": mentorId,
        "classroom.documentType": "classroom",
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        sessionRecordingLink: 1,
        classroom: {
          $arrayElemAt: ["$classroom", 0],
        },
        mentorSession: {
          $arrayElemAt: ["$mentorSession", 0],
        },
        topic: {
          $arrayElemAt: ["$topic", 0],
        },
        course: 1,
        attendance: 1,
        ...getSlotTimeFields(),
      },
    },
    { $sort: { createdAt: -1 } },
  ];
};

const getAdhocSessionAggregation = ({
  mentorId,
  startDate,
  endDate,
  filters,
}) => {
  return [
    {
      $match: {
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        type: 1,
        sessionRecordingLink: 1,
        batch: 1,
        previousTopic: 1,
        course: 1,
        mentorSession: 1,
        attendance: 1,
        ...getSlotTimeFields(),
      },
    },
    {
      $lookup: {
        from: "Batch",
        let: { batchId: "$batch.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$batchId"],
              },
            },
          },
          {
            $project: {
              code: 1,
              classroomTitle: 1,
              description: 1,
              school: 1,
              documentType: 1,
            },
          },
        ],
        as: "classroom",
      },
    },
    {
      $lookup: {
        from: "Topic",
        let: { topicId: "$previousTopic.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$topicId"],
              },
            },
          },
          {
            $lookup: {
              from: "File",
              let: {
                thumbnailId: "$thumbnailSmall.typeId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$id", "$$thumbnailId"],
                    },
                  },
                },
                {
                  $project: {
                    id: 1,
                    uri: 1,
                    name: 1,
                  },
                },
              ],
              as: "thumbnailSmall",
            },
          },
          {
            $project: {
              id: 1,
              order: 1,
              title: 1,
              description: 1,
              thumbnailSmall: {
                $arrayElemAt: ["$thumbnailSmall", 0],
              },
            },
          },
        ],
        as: "previousTopic",
      },
    },
    {
      $lookup: {
        from: "MentorSession",
        let: { mentorSessionId: "$mentorSession.typeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$id", "$$mentorSessionId"],
              },
            },
          },
          {
            $lookup: {
              from: "User",
              let: { userId: "$user.typeId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$id", "$$userId"],
                    },
                  },
                },
              ],
              as: "mentorUser",
            },
          },
          {
            $project: {
              user: {
                $arrayElemAt: ["$mentorUser", 0],
              },
            },
          },
        ],
        as: "mentorSession",
      },
    },
    {
      $match: {
        "mentorSession.user.id": mentorId,
        "classroom.documentType": "classroom",
      },
    },
    {
      $project: {
        id: 1,
        bookingDate: 1,
        sessionStartDate: 1,
        sessionEndDate: 1,
        sessionStatus: 1,
        sessionMode: 1,
        type: 1,
        sessionRecordingLink: 1,
        classroom: {
          $arrayElemAt: ["$classroom", 0],
        },
        mentorSession: {
          $arrayElemAt: ["$mentorSession", 0],
        },
        previousTopic: {
          $arrayElemAt: ["$previousTopic", 0],
        },
        course: 1,
        attendance: 1,
        ...getSlotTimeFields(),
      },
    },
    { $sort: { createdAt: -1 } },
  ];
};

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const classroomSessions = (async (root, params, context, info) => {
  const authentication = ifAuthorized(context);

  if (!(authentication && authentication.app && authentication.user)) {
    throw new UnauthorizedOperationError();
  }

  const filters = get(params, 'filter', null);
  const mentorId = get(filters, 'userId');
  const startDate = get(filters, 'startDate');
  const endDate = get(filters, 'endDate');
  console.log({
    params,
    mentorId,
    startDate,
    endDate,
    filters
  });
  if (!mentorId || !startDate || !endDate) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'userId/startDate/endDate is missing in input',
      },
    });
  }

  const batchSessionModel = getTypeQueryController('BatchSession', authentication);
  const adhocSessionModel = getTypeQueryController('AdhocSession', authentication);

  // TODO Build Filters
  
  const batchSessionRes = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      mentorId,
      startDate, 
      endDate,
      filters
    }),
  );

  const adhocSessionRes = await adhocSessionModel.aggregate(
    getAdhocSessionAggregation({
      mentorId,
      startDate,
      endDate,
      filters,
    }),
  );

  let resultArray = [...batchSessionRes, ...adhocSessionRes];
  resultArray = sortBy(resultArray, ['bookingDate']);
  // getting input from params
  return resultArray;
});

export default classroomSessions;
