/* eslint-disable */

import { get } from "lodash";
import { OLD_COURSE_ID } from "../../../../../../constants";
import { DatabaseRecordNotFoundError } from "../../../../../../constants/errors";
import getUserIdandAppNameAfterValidation from "../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation";
import validateCurrentTopicComponent from "../../utils/validateCurrentTopicComponent";
import { log } from "../../../../../../utils";
import { QueryController, RedisController } from "../../../controllers";

let defaultMentorMenteeSessionObject = {
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
const mentorMenteeSessionAggregation = (userId, courseId) => [
  {
    $match: {
      "course.typeId": courseId || OLD_COURSE_ID,
    },
  },
  {
    $lookup: {
      from: "MenteeSession",
      let: {
        menteeSession: "$menteeSession.typeId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$id", "$$menteeSession"],
            },
          },
        },
        {
          $lookup: {
            from: "User",
            let: {
              user: "$user.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$user"],
                  },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $project: {
            id: 1,
            user: {
              $arrayElemAt: ["$user", 0],
            },
          },
        },
      ],
      as: "menteeSession",
    },
  },
  {
    $match: {
      "menteeSession.user.id": userId,
    },
  },
  {
    $lookup: {
      from: "Topic",
      let: {
        topic: "$topic.typeId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$id", "$$topic"],
            },
          },
        },
        {
          $lookup: {
            from: "Chapter",
            let: {
              chapter: "$chapter.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$chapter"],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                },
              },
            ],
            as: "chapter",
          },
        },
        {
          $lookup: {
            from: "File",
            let: {
              thumbnail: "$thumbnail.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$thumbnail"],
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
            as: "thumbnail",
          },
        },
        {
          $lookup: {
            from: "File",
            let: {
              thumbnailSmall: "$thumbnailSmall.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$thumbnailSmall"],
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
            title: 1,
            order: 1,
            chapter: {
              $arrayElemAt: ["$chapter", 0],
            },
            thumbnail: {
              $arrayElemAt: ["$thumbnail", 0],
            },
            thumbnailSmall: {
              $arrayElemAt: ["$thumbnailSmall", 0],
            },
            description: 1,
          },
        },
      ],
      as: "topic",
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
        $arrayElemAt: ["$topic", 0],
      },
    },
  },
];

const getUserCurrentTopicComponentStatusAggregation = (userId, courseId) => [
  {
    $match: {
      "user.typeId": userId,
      "currentCourse.typeId": courseId,
    },
  },
  {
    $lookup: {
      from: "Course",
      let: {
        courseId: "$currentCourse.typeId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$id", "$$courseId"],
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
            from: "Chapter",
            let: {
              chapterId: "$chapters.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$id", "$$chapterId"],
                  },
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
                  from: "Topic",
                  let: {
                    topicsId: "$topics.typeId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ["$id", "$$topicsId"],
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
                        topicAssignmentQuestions: {
                          assignmentQuestions: {
                            id: 1,
                          },
                        },
                        topicComponentRule: 1,
                      },
                    },
                    {
                      $lookup: {
                        from: "File",
                        let: {
                          thumbnailId: "$thumbnail.typeId",
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
                        as: "thumbnail",
                      },
                    },
                    {
                      $lookup: {
                        from: "File",
                        let: {
                          thumbnailId: "$thumbnail.typeId",
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
                        as: "thumbnail",
                      },
                    },
                    {
                      $lookup: {
                        from: "File",
                        let: {
                          thumbnailSmallId: "$thumbnailSmall.typeId",
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ["$id", "$$thumbnailSmallId"],
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
                        title: 1,
                        order: 1,
                        isTrial: 1,
                        description: 1,
                        thumbnail: {
                          $arrayElemAt: ["$thumbnail", 0],
                        },
                        thumbnailSmall: {
                          $arrayElemAt: ["$thumbnailSmall", 0],
                        },
                        topicAssignmentQuestions: {
                          assignmentQuestions: {
                            id: 1,
                          },
                        },
                      },
                    },
                  ],
                  as: "topics",
                },
              },
            ],
            as: "chapters",
          },
        },
      ],
      as: "currentCourse",
    },
  },
  {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentCourse: {
        $arrayElemAt: ["$currentCourse", 0],
      },
      currentTopic: 1,
      user: 1,
    },
  },
  {
    $lookup: {
      from: "User",
      let: {
        userId: "$user.typeId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$id", "$$userId"],
            },
          },
        },
        {
          $project: {
            id: 1,
            studentProfile: 1,
          },
        },
        {
          $lookup: {
            from: "StudentProfile",
            let: {
              studentProfileId: "$studentProfile.typeId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$studentProfileId"],
                  },
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
                  from: "Batch",
                  let: {
                    batchId: "$batch.typeId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$id", "$$batchId"],
                        },
                      },
                    },
                    {
                      $lookup: {
                        from: "BatchCurrentComponentStatus",
                        let: {
                          ccId: "$currentComponent.typeId",
                        },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $eq: ["$id", "$$ccId"],
                              },
                            },
                          },
                          {
                            $project: {
                              currentCourse: 1,
                              currentTopic: 1,
                            },
                          },
                          {
                            $lookup: {
                              from: "Topic",
                              let: {
                                currentTopicId: "$currentTopic.typeId",
                              },
                              pipeline: [
                                {
                                  $match: {
                                    $expr: {
                                      $eq: ["$id", "$$currentTopicId"],
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
                              as: "currentTopic",
                            },
                          },
                          {
                            $project: {
                              currentCourse: 1,
                              enrollmentType: 1,
                              currentTopic: {
                                $arrayElemAt: ["$currentTopic", 0],
                              },
                              latestSessionStatus: 1,
                            },
                          },
                        ],
                        as: "currentComponent",
                      },
                    },
                    {
                      $project: {
                        id: 1,
                        type: 1,
                        currentComponent: {
                          $arrayElemAt: ["$currentComponent", 0],
                        },
                      },
                    },
                  ],
                  as: "batch",
                },
              },
              {
                $project: {
                  batch: {
                    $arrayElemAt: ["$batch", 0],
                  },
                },
              },
            ],
            as: "studentProfile",
          },
        },
        {
          $project: {
            studentProfile: {
              $arrayElemAt: ["$studentProfile", 0],
            },
          },
        },
      ],
      as: "user",
    },
  },
  {
    $project: {
      _id: 0,
      id: 1,
      currentCourse: 1,
      currentLearningObjective: 1,
      currentTopic: 1,
      enrollmentType: 1,
      currentTopicComponentType: 1,
      user: {
        $arrayElemAt: ["$user", 0],
      },
    },
  },
];

const fetchOrCacheQueryRes = async ({
  hkey,
  maxAge = 9000,
  dbCallback = () => {},
}) => {
  const redisClient = new RedisController({
    bypass: true,
  });
  let finalRes = null;
  const cachedRes = await redisClient.get(hkey);
  if (cachedRes) {
    log(`[MCS] CACHE_HIT: ${hkey}`);
    finalRes = cachedRes;
  } else {
    log(`[MCS] CACHE_MISS: ${hkey}`);
    finalRes = await dbCallback();
    await redisClient.set(finalRes, {
      hkey,
      maxAge,
    });
  }
  return finalRes;
};

const isMentorMenteeSessionAvailable = (mentorMenteeSessions, topicId) => {
  for (
    let mentorMenteeSessionPointer = 0;
    mentorMenteeSessionPointer < mentorMenteeSessions.length;
    mentorMenteeSessionPointer++
  ) {
    if (
      get(mentorMenteeSessions[mentorMenteeSessionPointer], "topic.id") ===
      topicId
    ) {
      return mentorMenteeSessions[mentorMenteeSessionPointer];
    }
  }
  return false;
};

const menteeCourseHomeworkMutationResolver = async (
  root,
  params,
  typeName,
  info,
  mutationName,
  ast,
  context
) => {
  const mcsMRTime = process.hrtime();
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
  let currentTopicComponentInfo;
  let mentorMenteeSessions;
  let finalTopicBasedHomeworkArray = [];

  const userCurrentTopicComponentStatusesModel = new QueryController(
    "UserCurrentTopicComponentStatus",
    {
      bypass: true,
    }
  );
  const res = await fetchOrCacheQueryRes({
    hkey: `mcs_UCTCS_${courseId}_${userId}`,
    maxAge: "2000",
    dbCallback: async () =>
      await userCurrentTopicComponentStatusesModel.aggregate(
        getUserCurrentTopicComponentStatusAggregation(userId, courseId)
      ),
  });
  currentTopicComponentInfo = res[0];
  // calling method to validate user current topic component status
  validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);

  const batchCurrentComponentCourseId = get(
    res,
    "[0].user.studentProfile.batch.currentComponent.currentCourse.id"
  );

  if ((courseId && batchCurrentComponentCourseId === courseId) || !courseId) {
    batchCurrentComponentInfo = get(
      res,
      "data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.currentComponent"
    );
  }

  const modelQuery = new QueryController("MentorMenteeSession", {
    bypass: true,
  });
  mentorMenteeSessions = await modelQuery.aggregate(
    mentorMenteeSessionAggregation(userId, courseId)
  );
  if (batchCurrentComponentInfo) {
    currentTopicOrder = get(batchCurrentComponentInfo, "currentTopic.order");
  } else {
    currentTopicOrder = get(res, "currentTopic.order");
  }

  const { currentCourse } = currentTopicComponentInfo;
  const { chapters } = currentCourse;
  if (!chapters || !chapters.length) {
    throw new DatabaseRecordNotFoundError({
      data: {
        error: "CurrentCourse.chapters: is not present",
      },
    });
  }
  if (chapters && chapters.length) {
    chapters.sort((a, b) => a.order - b.order);
  }
  chapters.forEach((chapter) => {
    if (!chapter || !chapter.topics || !chapter.topics.length) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: "CurrentCourse.chapter.topics: is not present",
        },
      });
    }
    const chapterTopics = chapter.topics;
    chapterTopics.sort((a, b) => a.order - b.order);
    chapterTopics.forEach((topic) => {
      if (get(topic, "order") > currentTopicOrder) return;
      let mentorMenteeSession = isMentorMenteeSessionAvailable(
        mentorMenteeSessions,
        topic.id
      );
      if (
        mentorMenteeSession &&
        get(mentorMenteeSession, "sessionStatus") === "completed"
      ) {
        finalTopicBasedHomeworkArray.push({
          ...mentorMenteeSession,
          mentorMenteeSessionAvailable: true,
          topic,
        });
      } else if (
        mentorMenteeSession &&
        get(mentorMenteeSession, "sessionStatus") !== "completed"
      ) {
        finalTopicBasedHomeworkArray.push({
          ...defaultMentorMenteeSessionObject,
          id: mentorMenteeSession.id,
          mentorMenteeSessionAvailable: true,
          sessionStatus: get(mentorMenteeSession, "sessionStatus"),
          topic,
        });
      } else if (!mentorMenteeSession) {
        finalTopicBasedHomeworkArray.push({
          ...defaultMentorMenteeSessionObject,
          id: mentorMenteeSession.id,
          mentorMenteeSessionAvailable: false,
          topic,
        });
      }
    });
  });
  const mcsMRTimeStop = process.hrtime(mcsMRTime);
  log(
    `Time Taken to execute mcsMR : ${
      (mcsMRTimeStop[0] * 1e9 + mcsMRTimeStop[1]) / 1e9
    } seconds`
  );
  return finalTopicBasedHomeworkArray;
};

export default menteeCourseHomeworkMutationResolver;
