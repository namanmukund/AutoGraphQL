/* eslint-disable */
import { get } from 'lodash';
import { slotTimes } from '../../../../../../constants';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { OTPMismatchError } from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import getSelectedSlotsTime from '../../../preHookFunctions/validation/utils/getSelectedSlotsTime';

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getSlotTimeFields = (session) => {
  const slotTimeObj = {};
  slotTimes.forEach((slotTime) => {
    if (session) {
      slotTimeObj[`${slotTime}`] = get(session, slotTime, false);
    } else {
      slotTimeObj[`${slotTime}`] = 1;
    }
  });
  return slotTimeObj;
};

const findSessionStartTime = (data) => {
  let startTime, endTime
  startTime = new Date(get(data, 'bookingDate'))
  endTime = new Date(get(data, 'bookingDate'));
  const { startMinutes, endMinutes } = data
  const startTimeHour = getSelectedSlotsTime(data)
  if (startTimeHour.length) {
    startTime.setHours(startTimeHour[0], 0, 0, 0)

    endTime = startTime.getTime() + endMinutes * 60 * 1000
    
    startTime.setHours(startTimeHour[0], startMinutes, 0, 0)
    endTime = new Date(endTime)
    if (startTime.getTime() >= endTime.getTime()) {
        let endTimeNumber = startTimeHour[0] + 1
        endTime.setHours(endTimeNumber)
    }
  }
  return { startTime, endTime }
}

const getBatchSessionAggregation = ({
  schoolCode,
  otp
}) => [
    {
      $match: {
        otp
      },
    },
    {
    $lookup: {
      from: 'BatchSession',
      let: {
        batchSessionId: '$batchSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$batchSessionId'],
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
                    $eq: ['$id', '$$batchId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'School',
                  localField: 'school.typeId',
                  foreignField: 'id',
                  as: 'school',
                },
              },
              {
                $lookup: {
                  from: 'StudentProfile',
                  let: {
                    studentProfileId: '$students.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ['$id', '$$studentProfileId'],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: 'User',
                        localField: 'user.typeId',
                        foreignField: 'id',
                        as: 'user',
                      }
                    },
                    {
                      $project: {
                        grade: 1,
                        section: 1,
                        rollNo: 1,
                        profileAvatarCode: 1,
                        user: {
                          id: 1,
                          name: 1,
                        },
                      },
                    },
                  ],
                  as: 'students',
                },
              },
              {
                $project: {
                  id: 1,
                  code: 1,
                  classroomTitle: 1,
                  school: {
                    code: 1,
                  },
                  students: 1,
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
            bookingDate: 1,
            startMinutes: 1,
            endMinutes: 1,
            topic: {
              id: 1,
              title: 1,
            },
            batch: {
              $arrayElemAt: ['$batch', 0],
            },
            ...getSlotTimeFields(),
          },
        },
      ],
      as: 'batchSession',
    },
    },
    {
      $project: {
        batchSession: {
          $arrayElemAt: ['$batchSession', 0],
        },
      },
    },
    {
      $match: {
        'batchSession.batch.school.code': schoolCode
      },
    },
  ]

const getBatchDetails = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication
) => {
  let batchSessionData = {}
  const { otp, schoolCode } = params
  if (!otp || !schoolCode) {
    throw new MissingMandatoryInputInRequestError()
  }
  const batchSessionModel = getTypeQueryController(
    'SchoolSessionOtp',
  );
  const batchSessionsArray = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      schoolCode,
      otp
    }),
  );
  if (!batchSessionsArray || !batchSessionsArray.length) {
    throw new OTPMismatchError()
  }
  const batchDetails = get(batchSessionsArray, '[0].batchSession')
  let { startTime, endTime } = findSessionStartTime(batchDetails)
  const students = get(batchDetails, 'batch.students', [])
  const batchStudentResult = []
  students.map((studentData) => {
    batchStudentResult.push({
      userId: get(studentData, 'user[0].id'),
      name: get(studentData, 'user[0].name'),
      grade: get(studentData, 'grade'),
      section: get(studentData, 'section'),
      rollNo: get(studentData, 'rollNo', ''),
      profileAvatar: get(studentData, 'profileAvatarCode'),
    });
  });
  batchSessionData = {
    batchId: get(batchDetails, 'batch.id'),
    batchCode: get(batchDetails, 'batch.code'),
    topicTitle: get(batchDetails, 'topic[0].title'),
    classroomTitle: get(batchDetails, 'batch.classroomTitle'),
    sessionStartDate: new Date(get(batchDetails, 'bookingDate')),
    startTime,
    endTime,
    sessionStartTime: '',
    batchStudents: batchStudentResult,
  }
  return batchSessionData
};

export default getBatchDetails;
