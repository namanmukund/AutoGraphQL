import { get } from 'lodash';
// import { OLD_COURSE_ID } from '../../../../../../constants';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import { QueryController } from '../../../controllers';
import { getTopicsArrFromCoursePackages, getTopicOrderFromCoursePackage } from './menteeCourseSyllabus';

const defaultMentorMenteeSessionObject = {
  sessionStatus: null,
  assignmentSubmitDate: null,
  quizSubmitDate: null,
  isSubmittedForReview: false,
  isQuizSubmitted: false,
  isAssignmentSubmitted: false,
  isAssignmentAttempted: false,
  isPracticeSubmitted: false,
  practiceSubmitDate: null,
  isHomeworkCheckedByMentor: false,
  isReviewSubmittedOnTime: false,
};
const mentorMenteeSessionAggregation = (userId) => [
  {
    $match: {
      sessionStatus: 'completed',
    },
  },
  {
    $lookup: {
      from: 'MenteeSession',
      let: {
        menteeSession: '$menteeSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$menteeSession'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            let: {
              user: '$user.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$user'],
                  },
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
              $arrayElemAt: ['$user', 0],
            },
          },
        },
      ],
      as: 'menteeSession',
    },
  },
  {
    $match: {
      'menteeSession.user.id': userId,
    },
  },
  {
    $lookup: {
      from: 'Topic',
      let: {
        topic: '$topic.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$topic'],
            },
          },
        },
        {
          $lookup: {
            from: 'Chapter',
            let: {
              chapter: '$chapter.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$chapter'],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                },
              },
            ],
            as: 'chapter',
          },
        },
        {
          $lookup: {
            from: 'File',
            let: {
              thumbnail: '$thumbnail.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$thumbnail'],
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
            as: 'thumbnail',
          },
        },
        {
          $lookup: {
            from: 'File',
            let: {
              thumbnailSmall: '$thumbnailSmall.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$thumbnailSmall'],
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
            as: 'thumbnailSmall',
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            order: 1,
            chapter: {
              $arrayElemAt: ['$chapter', 0],
            },
            thumbnail: {
              $arrayElemAt: ['$thumbnail', 0],
            },
            thumbnailSmall: {
              $arrayElemAt: ['$thumbnailSmall', 0],
            },
            description: 1,
          },
        },
      ],
      as: 'topic',
    },
  },
  {
    $project: {
      id: 1,
      sessionStatus: 1,
      assignmentSubmitDate: 1,
      quizSubmitDate: 1,
      isSubmittedForReview: 1,
      sessionJoinedByMenteeAt: 1,
      isQuizSubmitted: 1,
      isAssignmentSubmitted: 1,
      isAssignmentAttempted: 1,
      isPracticeSubmitted: 1,
      practiceSubmitDate: 1,
      isHomeworkCheckedByMentor: 1,
      isReviewSubmittedOnTime: 1,
      mentorMenteeSessionAvailable: true,
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
    },
  },
];

const getUserCurrentTopicComponentStatusAggregation = (userId, courseId) => [
  {
    $match: {
      'user.typeId': userId,
      'currentCourse.typeId': courseId,
    },
  },
  {
    $lookup: {
      from: 'Course',
      let: {
        courseId: '$currentCourse.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$courseId'],
            },
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            description: 1,
            bannerTitle: 1,
            bannerDescription: 1,
            badgeDescription: 1,
            defaultLoComponentRule: 1,
            chapters: 1,
          },
        },
        {
          $lookup: {
            from: 'Chapter',
            let: {
              chapterId: '$chapters.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$id', '$$chapterId'],
                  },
                },
              },
              {
                $match: {
                  status: 'published',
                },
              },
              {
                $project: {
                  id: 1,
                  title: 1,
                  order: 1,
                  topics: 1,
                },
              },
              {
                $lookup: {
                  from: 'Topic',
                  let: {
                    topicsId: '$topics.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ['$id', '$$topicsId'],
                        },
                      },
                    },
                    {
                      $match: {
                        status: 'published',
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        title: 1,
                        order: 1,
                        isTrial: 1,
                        description: 1,
                        topicQuestions: 1,
                        thumbnail: 1,
                        thumbnailSmall: 1,
                        topicAssignmentQuestions: 1,
                        topicHomeworkAssignmentQuestion: 1,
                        chapter: 1,
                        topicComponentRule: 1,
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
                              name: 1,
                            },
                          },
                        ],
                        as: 'thumbnail',
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
                              name: 1,
                            },
                          },
                        ],
                        as: 'thumbnail',
                      },
                    },
                    {
                      $lookup: {
                        from: 'File',
                        let: {
                          thumbnailSmallId: '$thumbnailSmall.typeId',
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ['$id', '$$thumbnailSmallId'],
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
                        as: 'thumbnailSmall',
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        title: 1,
                        order: 1,
                        isTrial: 1,
                        description: 1,
                        thumbnail: {
                          $arrayElemAt: ['$thumbnail', 0],
                        },
                        thumbnailSmall: {
                          $arrayElemAt: ['$thumbnailSmall', 0],
                        },
                        topicQuestions: 1,
                        topicAssignmentQuestions: 1,
                        topicHomeworkAssignmentQuestion: 1,
                        chapter: 1,
                        topicComponentRule: 1,
                      },
                    },
                  ],
                  as: 'topics',
                },
              },
            ],
            as: 'chapters',
          },
        },
      ],
      as: 'currentCourse',
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
            order: 1,
          },
        },
      ],
      as: 'currentTopic',
    },
  },
  {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentCourse: {
        $arrayElemAt: ['$currentCourse', 0],
      },
      currentLearningObjective: 1,
      currentTopic: {
        $arrayElemAt: ['$currentTopic', 0],
      },
      // user: 1,
    },
  },
];

const getUserBatchDetails = (userId) => [
  {
    $project: {
      id: 1,
      batch: 1,
      school: 1,
      user: 1,
    },
  },
  {
    $match: {
      'user.typeId': userId,
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
            coursePackage: 1,
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
                    $eq: [
                      '$id',
                      '$$ccId',
                    ],
                  },
                },
              },
              {
                $project: {
                  currentCourse: {
                    id: '$currentCourse.typeId',
                  },
                  enrollmentType: 1,
                  latestSessionStatus: 1,
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
                          $eq: [
                            '$id',
                            '$$currentTopicId',
                          ],
                        },
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        order: 1,
                      },
                    },
                  ],
                  as: 'currentTopic',
                },
              },
              {
                $project: {
                  currentCourse: 1,
                  enrollmentType: 1,
                  currentTopic: {
                    $arrayElemAt: [
                      '$currentTopic',
                      0,
                    ],
                  },
                  latestSessionStatus: 1,
                },
              },
            ],
            as: 'currentComponent',
          },
        },
        {
          $lookup: {
            from: 'User',
            let: { allottedMentorId: '$allottedMentor.typeId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$allottedMentorId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'File',
                  localField: 'profilePic.typeId',
                  foreignField: 'id',
                  as: 'profilePic',
                },
              },
              {
                $lookup: {
                  from: 'MentorProfile',
                  localField: 'mentorProfile.typeId',
                  foreignField: 'id',
                  as: 'mentorProfile',
                },
              },
              {
                $project: {
                  id: 1,
                  name: 1,
                  profilePic: {
                    $arrayElemAt: ['$profilePic', 0],
                  },
                  mentorProfile: {
                    $arrayElemAt: ['$mentorProfile', 0],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  name: 1,
                  profilePic: {
                    id: 1,
                    uri: 1,
                    name: 1,
                  },
                  mentorProfile: {
                    description: 1,
                    sessionLink: 1,
                    googleMeetLink: 1,
                    pythonCourseRating5: 1,
                    pythonCourseRating4: 1,
                    pythonCourseRating3: 1,
                    pythonCourseRating2: 1,
                    pythonCourseRating1: 1,
                    gitHubLink: 1,
                    linkedInLink: 1,
                    portfolioLink: 1,
                    experienceYear: 1,
                  },
                },
              },
            ],
            as: 'allottedMentor',
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
                  courses: 1,
                  id: 1,
                  status: 1,
                  title: 1,
                  topics: 1,
                },
              },
              {
                $lookup: {
                  from: 'Topic',
                  let: {
                    topicIds: '$topics.topic.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ['$id', '$$topicIds'],
                        },
                      },
                    },
                    {
                      $match: {
                        $expr: {
                          $eq: ['$status', 'published'],
                        },
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        title: 1,
                        order: 1,
                        isTrial: 1,
                        description: 1,
                        topicQuestions: 1,
                        thumbnail: 1,
                        thumbnailSmall: 1,
                        topicAssignmentQuestions: 1,
                        topicHomeworkAssignmentQuestion: 1,
                        chapter: 1,
                        topicComponentRule: 1,
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
                                $eq: [
                                  '$id',
                                  '$$thumbnailId',
                                ],
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
                        as: 'thumbnail',
                      },
                    },
                    {
                      $lookup: {
                        from: 'File',
                        let: {
                          thumbnailSmallId: '$thumbnailSmall.typeId',
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: [
                                  '$id',
                                  '$$thumbnailSmallId',
                                ],
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
                        as: 'thumbnailSmall',
                      },
                    },
                    {
                      $lookup: {
                        from: 'Chapter',
                        let: {
                          chapterId: '$chapter.typeId',
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: [
                                  '$id',
                                  '$$chapterId',
                                ],
                              },
                            },
                          },
                          {
                            $match: {
                              $expr: {
                                $eq: ['$status', 'published'],
                              },
                            },
                          },
                          {
                            $project: {
                              id: 1,
                              title: 1,
                              order: 1,
                            },
                          },
                        ],
                        as: 'chapter',
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        title: 1,
                        order: 1,
                        isTrial: 1,
                        description: 1,
                        thumbnail: {
                          $arrayElemAt: [
                            '$thumbnail',
                            0,
                          ],
                        },
                        thumbnailSmall: {
                          $arrayElemAt: [
                            '$thumbnailSmall',
                            0,
                          ],
                        },
                        topicQuestions: 1,
                        topicAssignmentQuestions: 1,
                        topicHomeworkAssignmentQuestion: 1,
                        chapter: {
                          $arrayElemAt: [
                            '$chapter',
                            0,
                          ],
                        },
                        topicComponentRule: 1,
                      },
                    },
                  ],
                  as: 'topicsArr',
                },
              },
            ],
            as: 'coursePackage',
          },
        },
        {
          $project: {
            id: 1,
            coursePackage: {
              $arrayElemAt: ['$coursePackage', 0],
            },
            allottedMentor: {
              $arrayElemAt: ['$allottedMentor', 0],
            },
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
    $lookup: {
      from: 'School',
      let: {
        schoolId: '$school.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$schoolId',
              ],
            },
          },
        },
        {
          $project: {
            id: 1,
            enrollmentType: 1,
          },
        },
      ],
      as: 'school',
    },
  },
  {
    $project: {
      _id: 0,
      id: 1,
      batch: {
        $arrayElemAt: ['$batch', 0],
      },
      school: {
        $arrayElemAt: ['$school', 0],
      },
    },
  },
];

const isMentorMenteeSessionAvailable = (mentorMenteeSessions, topicId) => {
  for (
    let mentorMenteeSessionPointer = 0;
    mentorMenteeSessionPointer < mentorMenteeSessions.length;
    mentorMenteeSessionPointer += 1
  ) {
    if (
      get(mentorMenteeSessions[mentorMenteeSessionPointer], 'topic.id')
      === topicId
    ) {
      return mentorMenteeSessions[mentorMenteeSessionPointer];
    }
  }
  return false;
};

const constructHomeworkArr = (finalTopicBasedHomeworkArray, mentorMenteeSession, topic) => {
  if (
    mentorMenteeSession
    && get(mentorMenteeSession, 'sessionStatus') === 'completed'
  ) {
    finalTopicBasedHomeworkArray.push({
      ...mentorMenteeSession,
      mentorMenteeSessionAvailable: true,
      topic,
    });
  } else if (
    mentorMenteeSession
    && get(mentorMenteeSession, 'sessionStatus') !== 'completed'
  ) {
    finalTopicBasedHomeworkArray.push({
      ...defaultMentorMenteeSessionObject,
      id: mentorMenteeSession.id,
      mentorMenteeSessionAvailable: true,
      sessionStatus: get(mentorMenteeSession, 'sessionStatus'),
      topic,
    });
  } else {
    finalTopicBasedHomeworkArray.push({
      ...defaultMentorMenteeSessionObject,
      id: mentorMenteeSession.id,
      mentorMenteeSessionAvailable: false,
      topic,
    });
  }
};

const menteeCourseHomeworkMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context,
) => {
  /*
  Calling method to validate token and return userId.
  we will compare this userId against userId passed in input
  both should be equal to perform further action
  */
  const userAndAppInfo = getUserIdandAppNameAfterValidation(context, true);
  const { courseId } = params;
  const { userIdFromContext: userId } = userAndAppInfo;
  let batchCurrentComponentInfo;
  let currentTopicOrder;
  const finalTopicBasedHomeworkArray = [];
  let coursePackage;
  let currentTopic;

  const userCurrentTopicComponentStatusesModel = new QueryController(
    'UserCurrentTopicComponentStatus',
    {
      bypass: true,
    },
  );
  const res = await userCurrentTopicComponentStatusesModel.aggregate(getUserCurrentTopicComponentStatusAggregation(userId, courseId));
  const currentTopicComponentInfo = res[0];
  const userBatchDetailsRes = new QueryController('StudentProfile', { bypass: true });
  const userBatchDetails = await userBatchDetailsRes.aggregate(getUserBatchDetails(userId));
  // let courseOrPackageFilter = {
  //   'course.typeId': courseId || OLD_COURSE_ID,
  // };
  if (get(userBatchDetails, '0.batch.coursePackage.id')) {
    coursePackage = get(userBatchDetails, '0.batch.coursePackage', {});
    // courseOrPackageFilter = {
    //   'coursePackage.typeId': get(coursePackage, 'id'),
    // };
  }

  // calling method to validate user current topic component status
  if (!coursePackage) validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  const batchCurrentComponentCourseId = get(userBatchDetails, '0.batch.currentComponent.currentCourse.id');

  if ((courseId && batchCurrentComponentCourseId === courseId) || !courseId || coursePackage) {
    batchCurrentComponentInfo = get(userBatchDetails, '0.batch.currentComponent');
  }
  const modelQuery = new QueryController('MentorMenteeSession', {
    bypass: true,
  });
  const mentorMenteeSessions = await modelQuery.aggregate(
    mentorMenteeSessionAggregation(userId),
  );
  if (batchCurrentComponentInfo || coursePackage) {
    currentTopicOrder = get(batchCurrentComponentInfo, 'currentTopic.order');
    currentTopic = get(batchCurrentComponentInfo, 'currentTopic');
  } else {
    currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');
    currentTopic = get(currentTopicComponentInfo, 'currentTopic');
  }
  let packageTopics = [];
  if (coursePackage && get(coursePackage, 'id')) {
    packageTopics = getTopicsArrFromCoursePackages(coursePackage, 'topics', get(userBatchDetails, '0.batch'));
  }
  const { chapters } = get(currentTopicComponentInfo, 'currentCourse', {});
  if ((!chapters || !chapters.length) && !(packageTopics || []).length) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: 'CurrentCourse.chapters: is not present',
      },
    });
  }
  if (chapters && chapters.length) {
    chapters.sort((a, b) => a.order - b.order);
  }
  if (coursePackage && get(coursePackage, 'id')) {
    const lastTopicBookedOrder = getTopicOrderFromCoursePackage(coursePackage, currentTopic, get(userBatchDetails, '0.batch')).order;
    packageTopics.forEach((topic) => {
      const mentorMenteeSession = isMentorMenteeSessionAvailable(
        mentorMenteeSessions,
        topic.id,
      );
      if (!mentorMenteeSession && (get(topic, 'order') >= lastTopicBookedOrder)) return;
      constructHomeworkArr(finalTopicBasedHomeworkArray, mentorMenteeSession, {
        ...topic,
        chapter: {
          id: get(coursePackage, 'id'),
          title: get(coursePackage, 'title', 'Package'),
          order: 1,
        },
      });
    });
  } else {
    chapters.forEach((chapter) => {
      if (!chapter || !chapter.topics || !chapter.topics.length) {
        throw new DatabaseRecordNotFoundError({
          data: {
            error: 'CurrentCourse.chapter.topics: is not present',
          },
        });
      }
      const { topics: chapterTopics, ...chapterData } = chapter;
      chapterTopics.sort((a, b) => a.order - b.order);
      chapterTopics.forEach((topic) => {
        const mentorMenteeSession = isMentorMenteeSessionAvailable(
          mentorMenteeSessions,
          topic.id,
        );
        if (!mentorMenteeSession && get(topic, 'order') >= currentTopicOrder) return;
        constructHomeworkArr(finalTopicBasedHomeworkArray, mentorMenteeSession, {
          ...topic, chapter: { ...chapterData },
        });
      });
    });
  }

  return finalTopicBasedHomeworkArray;
};

export default menteeCourseHomeworkMutationResolver;
