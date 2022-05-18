import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { QueryController } from '../../../controllers';
import { OLD_COURSE_ID } from '../../../../../../constants';
import { InvalidFieldType } from '../../../../../../constants/errors';

// query to get current component status of user.
const getUserCurrentTopicComponentStatusAggregation = (userId, courseIds) => [
  {
    $match: {
      'user.typeId': userId,
      'currentCourse.typeId': {
        $in: courseIds,
      },
    },
  },
  {
    $lookup: {
      from: 'Topic',
      let: {
        topicId: '$currentTopic.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$topicId'],
            },
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            description: 1,
            thumbnail: 1,
          },
        },
        {
          $lookup: {
            from: 'File',
            let: {
              thumbnailId: '$thumbnail.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$thumbnailId'],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  uri: 1,
                },
              },
            ],
            as: 'thumbnail',
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            description: 1,
            thumbnail: {
              $arrayElemAt: ['$thumbnail', 0],
            },
          },
        },
      ],
      as: 'currentTopic',
    },
  },
  {
    $project: {
      id: 1,
      currentCourse: {
        id: '$currentCourse.typeId',
      },
      currentTopic: {
        $arrayElemAt: ['$currentTopic', 0],
      },
      user: 1,
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
              $eq: ['$id', '$$userId'],
            },
          },
        },
        {
          $project: {
            studentProfile: 1,
          },
        },
        {
          $lookup: {
            from: 'StudentProfile',
            let: {
              studentProfileId: '$studentProfile.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$studentProfileId'],
                  },
                },
              },
              {
                $project: {
                  batch: 1,
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
                        from: 'BatchCurrentComponentStatus',
                        let: {
                          ccId: '$currentComponent.typeId',
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ['$id', '$$ccId'],
                              },
                            },
                          },
                          {
                            $project: {
                              currentCourse: {
                                id: '$currentCourse.typeId',
                              },
                              currentTopic: 1,
                            },
                          },
                          {
                            $lookup: {
                              from: 'Topic',
                              let: {
                                currentTopicId: '$currentTopic.typeId',
                              },
                              pipeline: [
                                {
                                  $match: {
                                    $expr: {
                                      $eq: ['$id', '$$currentTopicId'],
                                    },
                                  },
                                },
                                {
                                  $project: {
                                    id: 1,
                                    title: 1,
                                    order: 1,
                                    description: 1,
                                    thumbnail: {
                                      id: '$thumbnail.typeId',
                                    },
                                  },
                                },
                              ],
                              as: 'currentTopic',
                            },
                          },
                          {
                            $project: {
                              currentCourse: 1,
                              currentTopic: {
                                $arrayElemAt: ['$currentTopic', 0],
                              },
                            },
                          },
                        ],
                        as: 'currentComponent',
                      },
                    },
                    {
                      $project: {
                        currentComponent: {
                          $arrayElemAt: ['$currentComponent', 0],
                        },
                      },
                    },
                  ],
                  as: 'batch',
                },
              },
              {
                $project: {
                  batch: {
                    $arrayElemAt: ['$batch', 0],
                  },
                },
              },
            ],
            as: 'studentProfile',
          },
        },
        {
          $project: {
            studentProfile: {
              $arrayElemAt: ['$studentProfile', 0],
            },
          },
        },
      ],
      as: 'user',
    },
  },
  {
    $project: {
      _id: 0,
      id: 1,
      currentCourse: 1,
      currentTopic: 1,
      user: {
        $arrayElemAt: ['$user', 0],
      },
    },
  },
];

const getCourseLookup = (meta = false) => {
  if (meta) {
    return {
      $lookup: {
        from: 'Course',
        let: {
          courseId: '$courses.typeId',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$id', '$$courseId'],
              },
            },
          },
          {
            $lookup: {
              from: 'File',
              let: {
                thumbnailId: '$thumbnail.typeId',
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$id', '$$thumbnailId'],
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    id: 1,
                    uri: 1,
                  },
                },
              ],
              as: 'thumbnail',
            },
          },
          {
            $project: {
              id: 1,
              order: 1,
              title: 1,
              secondaryCategory: 1,
              thumbnail: { $arrayElemAt: ['$thumbnail', 0] },
              codingLanguages: {
                value: 1,
              },
            },
          },
        ],
        as: 'courses',
      },
    };
  }
  return {
    $lookup: {
      from: 'Course',
      let: {
        courseId: '$courses.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ['$id', '$$courseId'],
            },
          },
        },
        {
          $project: {
            id: 1,
          },
        },
      ],
      as: 'courses',
    },
  };
};

const getUserCoursesAggregation = (userId, meta = false) => [
  {
    $match: {
      'user.typeId': userId,
    },
  },
  {
    $project: {
      id: 1,
      courses: 1,
    },
  },
  {
    ...getCourseLookup(meta),
  },
];

const getUserCourseCompletionAggregation = (userId) => [
  {
    $match: {
      'user.typeId': userId,
    },
  },
  {
    $project: {
      id: 1,
      course: {
        id: '$course.typeId',
      },
    },
  },
];

const getUserBatchDetails = (userId) => [
  {
    $match: {
      'user.typeId': userId,
    },
  },
  {
    $project: {
      id: 1,
      batch: 1,
    },
  },
  {
    $lookup: {
      from: 'Batch',
      let: { batchId: '$batch.typeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$batchId'],
            },
          },
        },
        {
          $project: {
            id: 1,
            currentComponent: 1,
          },
        },
        {
          $lookup: {
            from: 'BatchCurrentComponentStatus',
            let: { currentComponentId: '$currentComponent.typeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$currentComponentId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'Course',
                  let: { currentCourseId: '$currentCourse.typeId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$id', '$$currentCourseId'],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: 'File',
                        let: {
                          thumbnailId: '$thumbnail.typeId',
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ['$id', '$$thumbnailId'],
                              },
                            },
                          },
                          {
                            $project: {
                              _id: 0,
                              id: 1,
                              uri: 1,
                            },
                          },
                        ],
                        as: 'thumbnail',
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        id: 1,
                        order: 1,
                        title: 1,
                        secondaryCategory: 1,
                        thumbnail: { $arrayElemAt: ['$thumbnail', 0] },
                        codingLanguages: {
                          value: 1,
                        },
                      },
                    },
                  ],
                  as: 'currentCourse',
                },
              },
              {
                $project: {
                  currentCourse: {
                    $arrayElemAt: ['$currentCourse', 0],
                  },
                },
              },
            ],
            as: 'currentComponent',
          },
        },
        {
          $project: {
            id: 1,
            currentComponent: {
              $arrayElemAt: ['$currentComponent', 0],
            },
          },
        },
      ],
      as: 'batch',
    },
  },
  {
    $project: {
      id: 1,
      batch: {
        $arrayElemAt: ['$batch', 0],
      },
    },
  },
];

const validateIncomingFields = (fieldsFetched = {}) => {
  const whiteListedFields = ['id', 'title', 'order', 'thumbnail',
    'secondaryCategory', 'currentTopic', 'isCourseCompleted', '__typename'];

  const fieldsFetchedArr = Object.keys(fieldsFetched);
  if (fieldsFetchedArr && fieldsFetchedArr.length) {
    if (!fieldsFetchedArr.every((field) => whiteListedFields.includes(field))) {
      throw new InvalidFieldType();
    }
  }
};

const getUserCurrentTopic = async (
  userCourseDoc,
  userCurrentTopicComponentStatuses,
) => {
  let currentTopicInfo = {};
  const userCurrentTopicComponentStatusesDoc = (userCurrentTopicComponentStatuses || []).filter((el) => get(el, 'currentCourse.id') === get(userCourseDoc, 'id'))[0];
  if (userCurrentTopicComponentStatusesDoc) {
    const currentTopicComponentInfo = userCurrentTopicComponentStatusesDoc;
    let batchCurrentComponentInfo = null;
    const batchCurrentComponentCourseId = get(
      userCurrentTopicComponentStatusesDoc,
      'user.studentProfile.batch.currentComponent.currentCourse.id',
    );
    if (batchCurrentComponentCourseId === get(userCourseDoc, 'id')) {
      batchCurrentComponentInfo = get(
        userCurrentTopicComponentStatusesDoc,
        'user.studentProfile.batch.currentComponent',
      );
    }

    if (batchCurrentComponentInfo) {
      currentTopicInfo = get(batchCurrentComponentInfo, 'currentTopic', {});
      if (get(currentTopicInfo, 'thumbnail.id')) {
        currentTopicInfo.thumbnail = {
          type: 'File',
          typeId: `${get(currentTopicInfo, 'thumbnail.id')}`,
        };
      }
    } else {
      /* eslint no-lonely-if:0 */
      if (currentTopicComponentInfo) {
        currentTopicInfo = get(currentTopicComponentInfo, 'currentTopic', {});
        if (get(currentTopicInfo, 'thumbnail.id')) {
          currentTopicInfo.thumbnail = {
            type: 'File',
            typeId: `${get(currentTopicInfo, 'thumbnail.id')}`,
          };
        }
      }
    }
  }
  return currentTopicInfo || {};
};

const getTypeQueryController = (typeName) => new QueryController(typeName, { bypass: true });

const getUserCourses = (async (root, params, context, info) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  await validateIncomingFields(fieldsFetched);

  // const redisClient = new RedisController({
  //   bypass: true,
  // });
  if (input && get(input, 'userId')) {
    const userId = get(input, 'userId');
    const courseProgress = get(input, 'courseProgress', false);
    let updatedCourseArr = [];
    /** Check if data exists in redis */
    // const cachedUserCourses = await redisClient.get(`userCourses_${userId}`);
    // let userCoursesRes = null;
    // if (cachedUserCourses && false) {
    //   log(`[USER_COURSES] CACHE_HIT: ${`userCourses_${userId}`}`);
    //   userCoursesRes = cachedUserCourses;
    // } else {
    // log(`[USER_COURSES] CACHE_MISS: ${`userCourses_${userId}`}`);
    /**
     * Checking if user is enrolled into a batch.
     * */
    const studentProfileModel = getTypeQueryController('StudentProfile');
    const studentProfileRes = await studentProfileModel.aggregate(getUserBatchDetails(userId));
    if (studentProfileRes && get(studentProfileRes, '0.batch.currentComponent.currentCourse.id')) {
      updatedCourseArr.push(get(studentProfileRes, '0.batch.currentComponent.currentCourse', {}));
    }
    const userCoursesModel = getTypeQueryController('UserCourse');
    const userCoursesRes = await userCoursesModel.aggregate(getUserCoursesAggregation(userId, courseProgress));
    // await redisClient.set(userCoursesRes, {
    //   hkey: `userCourses_${userId}`,
    //   maxAge: 900,
    // });
    // }
    if (userCoursesRes && userCoursesRes.length) {
      const userCourses = get(userCoursesRes[0], 'courses', []);
      let newPythonCourseExists = false;
      let oldPythonCourseExists = false;
      let userCourseCompletions = [];
      let userCurrentTopicComponentStatuses = [];
      if (userCourses && userCourses.length && courseProgress) {
        const userCurrentTopicComponentStatusesModel = getTypeQueryController('UserCurrentTopicComponentStatus');
        userCurrentTopicComponentStatuses = await userCurrentTopicComponentStatusesModel.aggregate(
          getUserCurrentTopicComponentStatusAggregation(
            userId,
            userCourses.map((el) => get(el, 'id')),
          ),
        ) || [];
        const userCourseCompletionModel = getTypeQueryController('UserCourseCompletion');
        userCourseCompletions = await userCourseCompletionModel.aggregate(getUserCourseCompletionAggregation(userId)) || [];
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const userCourseDoc of userCourses) {
        userCourseDoc.isCourseCompleted = false;
        if (courseProgress) {
          /** Checking if Course if Completed */
          const courseCompletion = (userCourseCompletions || []).filter((el) => get(el, 'course.id') === get(userCourseDoc, 'id'));
          if (courseCompletion && courseCompletion.length) {
            userCourseDoc.isCourseCompleted = true;
          }
          /** Getting UserCurrent Component Status for particular course */
          /* eslint no-await-in-loop:0 */
          const currentTopic = await getUserCurrentTopic(userCourseDoc, (userCurrentTopicComponentStatuses || []));
          if (currentTopic && currentTopic.id) {
            userCourseDoc.currentTopic = { type: 'Topic', typeId: get(currentTopic, 'id') };
          }
          /** Attaching Course Thumbnail */
          if (get(userCourseDoc, 'thumbnail.id')) {
            userCourseDoc.thumbnail = { type: 'File', typeId: `${get(userCourseDoc, 'thumbnail.id')}` };
          }
        }
        /** Checking if Course is New in Python Segment */
        if (get(userCourseDoc, 'codingLanguages', []).includes('python') && get(userCourseDoc, 'id') !== OLD_COURSE_ID) {
          newPythonCourseExists = true;
        }
        /** Checking if It Is OLD Python Course */
        if (get(userCourseDoc, 'id') === OLD_COURSE_ID) {
          /** Not Required For Now */
          // eslint-disable-next-line no-await-in-loop
          // if (userCourseCompletionId) {
          oldPythonCourseExists = true;
          updatedCourseArr.push(userCourseDoc);
          // }
        } else {
          updatedCourseArr.push(userCourseDoc);
        }
      }
      /** Remove OLD Python Course If New One Exists */
      if (newPythonCourseExists && oldPythonCourseExists) {
        updatedCourseArr = updatedCourseArr.filter((course) => get(course, 'id') !== OLD_COURSE_ID);
      }
    }
    if (updatedCourseArr && updatedCourseArr.length) {
      const tempUniqueCourseIds = [];
      return (updatedCourseArr || []).reverse().filter((el) => {
        const isDuplicate = tempUniqueCourseIds.includes(el.id);
        if (!isDuplicate) {
          tempUniqueCourseIds.push(el.id);
          return true;
        }
        return false;
      });
    }
  }
  return [];
});

export default getUserCourses;
