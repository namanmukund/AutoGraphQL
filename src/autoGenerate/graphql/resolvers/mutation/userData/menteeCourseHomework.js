import { get } from 'lodash';
// import { OLD_COURSE_ID } from '../../../../../../constants';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import { QueryController } from '../../../controllers';
import {
  getTopicsArrFromCoursePackages, getTopicOrderFromCoursePackage, getUserBatchDetails, fetchAndCacheQueryRes, getBatchDetailAggregation, oneDayExpireCacheInSeconds,
} from './menteeCourseSyllabus';
import { HEADER_VARIABLES, OLD_COURSE_ID } from '../../../../../../constants';
import { activeClassroomIdFromContext, activeCourseIdFromContext } from '../../../../../../utils/getUserActiveClassroom';

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

const getMentorMenteeSessions = async (userId) => {
  const menteeSessionController = new QueryController('MenteeSession', { bypass: true });
  const mentorMenteeSessionController = new QueryController('MentorMenteeSession', { bypass: true });
  const menteeSessions = await menteeSessionController.fetchMultiple({ 'user.typeId': userId });
  const res = await mentorMenteeSessionController.fetchMultiple({ 'menteeSession.typeId': (menteeSessions || []).map((menteeSession) => get(menteeSession, 'id')) });
  return (res || []).map((session) => ({ ...get(session, '_doc', {}), topic: { id: get(session, 'topic.typeId') } }));
};

const getUserCurrentTopicComponentStatusAggregation = (userId, courseId) => [
  {
    $match: {
      'user.typeId': userId,
      'currentCourse.typeId': courseId || OLD_COURSE_ID,
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
                        topicQuestions: {
                          $ifNull: ['$topicQuestions', []],
                        },
                        thumbnail: 1,
                        thumbnailSmall: 1,
                        topicAssignmentQuestions: 1,
                        topicHomeworkAssignmentQuestion: {
                          $ifNull: ['$topicHomeworkAssignmentQuestion', []],
                        },
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
                        topicQuestions: {
                          $ifNull: ['$topicQuestions', []],
                        },
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
      currentLearningObjective: 1,
      currentCourse: {
        $arrayElemAt: ['$currentCourse', 0],
      },
      currentTopic: {
        $arrayElemAt: ['$currentTopic', 0],
      },
      user: 1,
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
    && get(mentorMenteeSession, 'sessionStatus')
  ) {
    finalTopicBasedHomeworkArray.push({
      ...mentorMenteeSession,
      id: get(mentorMenteeSession, 'id'),
      mentorMenteeSessionAvailable: true,
      topic,
    });
  } else {
    finalTopicBasedHomeworkArray.push({
      ...defaultMentorMenteeSessionObject,
      id: get(topic, 'id'),
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
  let userBatchDetails;
  let userActiveClassroom;

  let activeClassroomId = activeClassroomIdFromContext(context);

  if (!activeClassroomId) {
    // Fetch user profile having batches.
    const userBatchDetailsRes = new QueryController('StudentProfile', { bypass: true });
    userBatchDetails = await fetchAndCacheQueryRes({
      hkey: `user::studentProfile::batches::${userId}`,
      maxAge: oneDayExpireCacheInSeconds, // 1 day
      dbCallback: () => userBatchDetailsRes.aggregate(getUserBatchDetails(userId)),
    });

    // If Classroom Id is not sent in context i.e user is visiting sessions page after login and active classroom is not set in client.
    // Then we select default batch as active.
    if (userBatchDetails && userBatchDetails.length) {
      const batchDetails = userBatchDetails[0];
      if (get(batchDetails, 'batch.typeId')) {
        activeClassroomId = get(batchDetails, 'batch.typeId');
      } else if (get(batchDetails, 'batches', []).length) {
        activeClassroomId = get(batchDetails, 'batches.0.typeId');
      }
    }
  }

  if (activeClassroomId) {
    const batchDetailsModel = new QueryController('Batch', { bypass: true });
    userActiveClassroom = await fetchAndCacheQueryRes({
      hkey: `batches::${activeClassroomId}`,
      maxAge: oneDayExpireCacheInSeconds, // 1 day
      dbCallback: () => batchDetailsModel.aggregate(getBatchDetailAggregation(activeClassroomId)),
    });
    if (Array.isArray(userActiveClassroom) && userActiveClassroom.length) userActiveClassroom = userActiveClassroom[0];
  }

  const responseObj = get(context, 'res');
  const activeCourseId = activeCourseIdFromContext(context);
  if (!activeCourseId && !activeClassroomIdFromContext(context) && responseObj && get(userActiveClassroom, 'id')) {
    responseObj.header(HEADER_VARIABLES.CLASSROOM_UID, get(userActiveClassroom, 'id'));
  }

  let userCurrentTopicComponentStatusesRes = [];
  if (!get(userActiveClassroom, 'coursePackage.id')) {
    await userCourseSyllabusMethod(context, params);
    const userCurrentCompModel = new QueryController('UserCurrentTopicComponentStatus', { bypass: true });
    userCurrentTopicComponentStatusesRes = await userCurrentCompModel.aggregate(getUserCurrentTopicComponentStatusAggregation(userId, courseId));
  }

  const currentTopicComponentInfo = userCurrentTopicComponentStatusesRes[0];

  if (get(userActiveClassroom, 'coursePackage.id')) {
    coursePackage = get(userActiveClassroom, 'coursePackage', {});
  }

  // calling method to validate user current topic component status
  if (!coursePackage) validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  const batchCurrentComponentCourseId = get(userActiveClassroom, 'currentComponent.currentCourse.id');

  if ((courseId && batchCurrentComponentCourseId === courseId) || !courseId || get(coursePackage, 'id')) {
    batchCurrentComponentInfo = get(userActiveClassroom, 'currentComponent');
  }

  const mentorMenteeSessions = await getMentorMenteeSessions(userId, context);
  if (batchCurrentComponentInfo || coursePackage) {
    currentTopicOrder = get(batchCurrentComponentInfo, 'currentTopic.order');
    currentTopic = get(batchCurrentComponentInfo, 'currentTopic');
  } else {
    currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');
    currentTopic = get(currentTopicComponentInfo, 'currentTopic');
  }
  let packageTopics = [];
  if (coursePackage && get(coursePackage, 'id')) {
    packageTopics = getTopicsArrFromCoursePackages(coursePackage, userActiveClassroom);
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
    const lastTopicBookedOrder = getTopicOrderFromCoursePackage(coursePackage, currentTopic, userActiveClassroom).order;
    packageTopics.forEach((topic) => {
      const mentorMenteeSession = isMentorMenteeSessionAvailable(
        mentorMenteeSessions,
        topic.id,
      );
      if ((get(topic, 'order') > lastTopicBookedOrder) && !mentorMenteeSession) return;
      constructHomeworkArr(finalTopicBasedHomeworkArray, mentorMenteeSession, {
        ...topic,
        topicQuestions: (get(topic, 'topicQuestions', []) || []).map((topicQuestion) => ({ id: get(topicQuestion, 'typeId') })),
        topicAssignmentQuestions: (get(topic, 'topicAssignmentQuestions', []) || []).map((topicAssignmentQuestion) => ({ id: get(topicAssignmentQuestion, 'typeId') })),
        topicHomeworkAssignmentQuestion: (get(topic, 'topicHomeworkAssignmentQuestion', []) || []).map((homeworkAssignmentQuestion) => ({ id: get(homeworkAssignmentQuestion, 'typeId') })),
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
