import { get } from 'lodash';
import {
  enrollmentTypes,
  slotTimes,
  sessionStatus, OLD_COURSE_ID, topicTypes,
} from '../../../../../../constants';
import {
  DatabaseRecordNotFoundError,
} from '../../../../../../constants/errors';
import getUserIdandAppNameAfterValidation from '../../../preHookFunctions/validation/utils/getUserIdandAppNameAfterValidation';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import validateCurrentTopicComponent from '../../utils/validateCurrentTopicComponent';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import { log } from '../../../../../../utils';
import { QueryController, RedisController } from '../../../controllers';
// import { parseBadges } from '../utils/parseBadges';
// import { sortBadges } from '../utils/sortBadges';

const getSlotTimeFields = (returnObj = false) => {
  let slotTimeFields = '';
  const slotTimeObj = {};
  slotTimes.forEach((slotTime) => {
    slotTimeFields += `${slotTime} `;
    slotTimeObj[`${slotTime}`] = 1;
  });
  if (returnObj) return slotTimeObj;
  return slotTimeFields;
};

// calculate if user can consume a topic or not
const isTopicAccessible = (enrollmentType, isTopicFree) => {
  if (enrollmentType === enrollmentTypes.pro) {
    return true;
  }
  return !!isTopicFree;
};

// return mentor object in the defined format
const getMentorData = (allottedMentor) => {
  const {
    id, name, profilePic, mentorProfile,
  } = allottedMentor;
  const mentor = { id, name, profilePic };
  if (mentorProfile) {
    const {
      description,
      linkedInLink,
      portfolioLink,
      gitHubLink,
      experienceYear,
      pythonCourseRating5,
      pythonCourseRating4,
      pythonCourseRating3,
      pythonCourseRating2,
      pythonCourseRating1,
      sessionLink,
      googleMeetLink,
    } = mentorProfile;
    mentor.experienceYear = experienceYear;
    mentor.description = description;
    mentor.linkedInLink = linkedInLink;
    mentor.portfolioLink = portfolioLink;
    mentor.gitHubLink = gitHubLink;
    mentor.sessionLink = sessionLink;
    mentor.googleMeetLink = googleMeetLink;
    let totalRatingUsers = 0;
    let cumulativeRating = 0;
    if (pythonCourseRating5) {
      totalRatingUsers += pythonCourseRating5;
      cumulativeRating += pythonCourseRating5 * 5;
    }
    if (pythonCourseRating4) {
      totalRatingUsers += pythonCourseRating4;
      cumulativeRating += pythonCourseRating4 * 4;
    }
    if (pythonCourseRating3) {
      totalRatingUsers += pythonCourseRating3;
      cumulativeRating += pythonCourseRating3 * 3;
    }
    if (pythonCourseRating2) {
      totalRatingUsers += pythonCourseRating2;
      cumulativeRating += pythonCourseRating2 * 2;
    }
    if (pythonCourseRating1) {
      totalRatingUsers += pythonCourseRating1;
      cumulativeRating += pythonCourseRating1;
    }
    mentor.averageRating = totalRatingUsers ? Math.round(((cumulativeRating) / totalRatingUsers) * 100) / 100 : 0;
  }
  return mentor;
};

// query to get current component status of user
// const getUserCurrentTopicComponentStatus = (userId, courseId) => `
//   query{
//     userCurrentTopicComponentStatuses(filter:{
//       and:[
//         {user_some:{
//         id:"${userId}"
//         }},
//         {currentCourse_some:{
//           ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
//         }}
//       ]
//     }){
//       id
//       currentCourse{
//         id
//         title
//         description
//         bannerTitle
//         bannerDescription
//         badgeDescription
//         defaultLoComponentRule {
//           componentName
//           order
//         }
//         chapters(
//             filter: {
//               status: ${PUBLISHED}
//             }
//           ){
//           id
//           title
//           order
//           topics(
//             filter: {
//               and:[
//                 {
//                   status:${PUBLISHED}
//                 }
//                 {
//                   courses_some:{
//                     ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
//                   }
//                 }
//               ]
//             }
//           ){
//             id
//             title
//             order
//             isTrial
//             description
//             thumbnail{
//               id
//               uri
//               name
//             }
//             thumbnailSmall{
//               id
//               uri
//               name
//             }
//           }
//         }
//       }
//       currentTopic{
//         id
//       }
//       currentLearningObjective{
//         id
//       }
//       user{
//         studentProfile{
//           school{
//             enrollmentType
//           }
//           batch{
//             id
//             type
//             course{
//               id
//             }
//             allottedMentor{
//               id
//               name
//               profilePic{
//                 id
//                 uri
//                 name
//               }
//               mentorProfile{
//                 description
//                 sessionLink
//                 googleMeetLink
//                 pythonCourseRating5
//                 pythonCourseRating4
//                 pythonCourseRating3
//                 pythonCourseRating2
//                 pythonCourseRating1
//                 gitHubLink
//                 linkedInLink
//                 portfolioLink
//                 experienceYear
//               }
//             }
//             currentComponent{
//               enrollmentType
//               currentCourse{
//                 id
//                 order
//               }
//               currentTopic{
//                 id
//                 order
//               }
//               latestSessionStatus
//             }
//           }
//         }
//       }
//       currentTopicComponentType
//       enrollmentType
//     }
//   }
//   `;

// query to get chapters and topics belonging to a course
// const getCourseQuery = (courseId) => `
//     query{
//       courses(filter:{
//         ${courseId ? `id: "${courseId}"` : `and:[{title: "${GLOBAL_COURSE_TITLE}"}, {status: ${PUBLISHED}}]`}
//       }){
//         id
//         title
//         description
//         badgeDescription
//         defaultLoComponentRule {
//           componentName
//           order
//         }
//         chapters(
//             filter: {
//               status: ${PUBLISHED}
//             }
//           ){
//           id
//           title
//           order
//           topics(
//             filter: {
//               and:[
//                 {
//                   status:${PUBLISHED}
//                 }
//                 {
//                   courses_some:{
//                     ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
//                   }
//                 }
//               ]
//             },
//           ){
//             id
//             title
//             order
//             isTrial
//             description
//             isTrial
//             thumbnail{
//               id
//               uri
//               name
//             }
//             thumbnailSmall{
//               id
//               uri
//               name
//             }
//           }
//         }
//       }
//     }
//   `;

const getCourseAggregation = (courseId) => [
  {
    $match: {
      id: courseId || OLD_COURSE_ID,
      status: 'published',
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
              $in: [
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
                    $in: [
                      '$id',
                      '$$topicsId',
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
                  isTrial: 1,
                  description: 1,
                  thumbnail: 1,
                  thumbnailSmall: 1,
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
  {
    $project: {
      id: 1,
      title: 1,
      description: 1,
      badgeDescription: 1,
      defaultLoComponentRule: {
        componentName: 1,
        order: 1,
      },
      chapters: 1,
    },
  },
];
// query to get mentee Sessions
const getMenteeSessionAggregation = (userId, courseId, courseOrPackageFilter = {}) => [
  {
    $match: {
      'user.typeId': userId,
      ...courseOrPackageFilter,
    },
  },
  {
    $lookup: {
      from: 'Topic',
      let: {
        topicId: '$topic.typeId',
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
          $lookup: {
            from: 'Chapter',
            let: {
              chapterId: '$chapter.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$chapterId'],
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
            description: 1,
            order: 1,
            isTrial: 1,
            chapter: {
              $arrayElemAt: ['$chapter', 0],
            },
            thumbnail: {
              $arrayElemAt: ['$thumbnail', 0],
            },
            thumbnailSmall: {
              $arrayElemAt: ['$thumbnailSmall', 0],
            },
          },
        },
      ],
      as: 'topic',
    },
  },
  {
    $project: {
      id: 1,
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
      bookingDate: 1,
      ...getSlotTimeFields(true),
    },
  },
];

const getBatchSessionsAggregation = (batchId, courseId, courseOrPackageFilter = {}) => [
  {
    $match: {
      'batch.typeId': batchId,
      ...courseOrPackageFilter,
    },
  },
  {
    $lookup: {
      from: 'Topic',
      let: {
        topicId: '$topic.typeId',
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
            description: 1,
            order: 1,
            isTrial: 1,
            thumbnail: {
              $arrayElemAt: ['$thumbnail', 0],
            },
            thumbnailSmall: {
              $arrayElemAt: ['$thumbnailSmall', 0],
            },
          },
        },
      ],
      as: 'topic',
    },
  },
  {
    $lookup: {
      from: 'MentorSession',
      let: {
        mentorSessionId: '$mentorSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$mentorSessionId'],
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
                    $eq: ['$id', '$$userId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'File',
                  let: {
                    profilePicId: '$profilePic.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$id', '$$profilePicId'],
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
                  as: 'profilePic',
                },
              },
              {
                $lookup: {
                  from: 'MentorProfile',
                  let: {
                    mentorProfileId: '$mentorProfile.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$id', '$$mentorProfileId'],
                        },
                      },
                    },
                    {
                      $project: {
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
                  ],
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
            ],
            as: 'user',
          },
        },
        {
          $project: {
            user: {
              $arrayElemAt: ['$user', 0],
            },
          },
        },
      ],
      as: 'mentorSession',
    },
  },
  {
    $project: {
      id: 1,
      mentorSession: {
        $arrayElemAt: ['$mentorSession', 0],
      },
      bookingDate: 1,
      sessionEndDate: 1,
      topic: {
        $arrayElemAt: ['$topic', 0],
      },
      ...getSlotTimeFields(true),
    },
  },
];

// query to get mentor from salesOperation
const allotedMentorAggregation = (userId, courseId) => [
  {
    $match: {
      'client.typeId': userId,
      'course.typeId': courseId || OLD_COURSE_ID,
      leadStatus: {
        $ne: 'unassigned',
      },
    },
  },
  {
    $lookup: {
      from: 'User',
      let: {
        userId: '$allottedMentor.typeId',
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
          $lookup: {
            from: 'File',
            let: {
              profilePicId: '$profilePic.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$profilePicId'],
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
            as: 'profilePic',
          },
        },
        {
          $lookup: {
            from: 'MentorProfile',
            let: {
              mentorProfileId: '$mentorProfile.typeId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$mentorProfileId'],
                  },
                },
              },
              {
                $project: {
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
            ],
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
      ],
      as: 'allottedMentor',
    },
  },
  {
    $project: {
      id: 1,
      allottedMentor: {
        $arrayElemAt: ['$allottedMentor', 0],
      },
    },
  },
];

// query to get mentor from MMS
const allotedMentorFromMMSAggregation = (userId, courseId, courseOrPackageFilter = {}) => [
  {
    $match: {
      ...courseOrPackageFilter,
    },
  },
  {
    $lookup: {
      from: 'MenteeSession',
      let: {
        menteeSessionId: '$menteeSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$menteeSessionId'],
            },
          },
        },
        {
          $project: {
            id: 1,
            user: 1,
          },
        },
      ],
      as: 'menteeSession',
    },
  },
  {
    $project: {
      id: 1,
      menteeSession: {
        $arrayElemAt: ['$menteeSession', 0],
      },
      mentorSession: 1,
    },
  },
  {
    $match: {
      'menteeSession.user.typeId': userId,
    },
  },
  {
    $lookup: {
      from: 'MentorSession',
      let: {
        mentorSessionId: '$mentorSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$mentorSessionId'],
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
                    $eq: ['$id', '$$userId'],
                  },
                },
              },
              {
                $lookup: {
                  from: 'File',
                  let: {
                    profilePicId: '$profilePic.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$id', '$$profilePicId'],
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
                  as: 'profilePic',
                },
              },
              {
                $lookup: {
                  from: 'MentorProfile',
                  let: {
                    mentorProfileId: '$mentorProfile.typeId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ['$id', '$$mentorProfileId'],
                        },
                      },
                    },
                    {
                      $project: {
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
                  ],
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
            ],
            as: 'user',
          },
        },
        {
          $project: {
            user: {
              $arrayElemAt: ['$user', 0],
            },
          },
        },
      ],
      as: 'mentorSession',
    },
  },
  {
    $project: {
      id: 1,
      mentorSession: {
        $arrayElemAt: ['$mentorSession', 0],
      },
    },
  },
];

// query to get chapters and topics belomngin to a course
const getTopicQueryNewCourse = (topicId) => `
query{
  topic(id:"${topicId}"){
    id
    topicComponentRule{
      order
      componentName
      learningObjectiveComponentsRule {
        componentName
        order
      }
      learningObjective{
        id
        messagesMeta{
            count
        }
        questionBankMeta(filter:{and:[{assessmentType:practiceQuestion}{status:published}]}){
            count
        }
        comicStripsMeta(filter:{status:published}){
            count
        }
      }
      video{
        id
      }
      blockBasedProject{
        id
      }
    }
  }
}
`;

const fetchOrCacheQueryRes = async ({ hkey, maxAge = 9000, dbCallback = () => { } }) => {
  const redisClient = new RedisController({
    bypass: true,
  });
  let finalRes;
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

/** Filter DefaultLoComponentRule based on Lo meta */
const getFilteredLoComponentRule = (learningObjective, courseLoComponentRule, topicLoComponentRule = []) => {
  if (topicLoComponentRule && topicLoComponentRule.length) {
    return topicLoComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
  }
  if (courseLoComponentRule && courseLoComponentRule.length && learningObjective) {
    return (
      courseLoComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order)
        .filter((componentRule) => {
          let componentExists = false;
          switch (get(componentRule, 'componentName')) {
            case 'comicStrip':
              if (get(learningObjective, 'comicStripsMeta.count', 0) > 0) {
                componentExists = true;
              }
              break;
            case 'practiceQuestion':
              if (get(learningObjective, 'questionBankMeta.count', 0) > 0) {
                componentExists = true;
              }
              break;
            case 'message':
              if (get(learningObjective, 'messagesMeta.count', 0) > 0) {
                componentExists = true;
              }
              break;
            case 'chatbot':
              if ((get(learningObjective, 'messagesMeta.count', 0) > 0)) {
                componentExists = true;
              }
              break;
            default:
              componentExists = false;
          }
          return componentExists;
        })
    );
  }
  return [];
};

const getUserCurrentTopicComponentStatusAggregation = (userId, courseId) => [
  {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentLearningObjective: 1,
      currentCourse: 1,
      currentTopic: 1,
      user: 1,
    },
  },
  {
    $match: {
      'user.typeId': userId,
      'currentCourse.typeId': courseId || OLD_COURSE_ID,
    },
  }, {
    $lookup: {
      from: 'Course',
      let: {
        courseId: '$currentCourse.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [
                '$id',
                '$$courseId',
              ],
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
                    $in: [
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
                          $in: [
                            '$id',
                            '$$topicsId',
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
                        chapter: 1,
                        topicComponentRule: 1,
                        classType: 1,
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
                        topicAssignmentQuestions: {
                          assignmentQuestions: {
                            id: 1,
                          },
                        },
                        chapter: 1,
                        topicComponentRule: 1,
                        classType: 1,
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
  }, {
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
  }, {
    $project: {
      id: 1,
      currentTopicComponentType: 1,
      enrollmentType: 1,
      currentLearningObjective: 1,
      currentCourse: {
        $arrayElemAt: [
          '$currentCourse',
          0,
        ],
      },
      currentTopic: {
        $arrayElemAt: [
          '$currentTopic',
          0,
        ],
      },
    },
  }];

/**
 * Below Aggregation can now be replaced with following library
 * const pipeline = new AggregationBuilder('SP')
    .Project(OnlyPayload('id', 'batch', 'school', 'user'))
    .Match({ 'user.typeId': userId })
    .Lookup(ConditionPayload('Batch', 'batch',
      {
        variableList: [{
          var: 'batchId',
          source: 'batch.typeId',
          key: 'primary',
        }],
        nestedAggregation: new AggregationBuilder('Batch')
          .Project(OnlyPayload('id', 'currentComponent', 'coursePackage'))
          .Project({
            id: 1,
            batch: ArrayElemAt('$batch', 0),
            allottedMentor: ArrayElemAt('$allottedMentor', 0),
            currentComponent: ArrayElemAt('$currentComponent', 0),
          }),
      }))
    .Lookup(ConditionPayload('School', 'school',
      {
        project: { ...OnlyPayload('id', 'enrollmentType') },
        variableList: [{
          var: 'schoolId',
          source: 'school.typeId',
          key: 'primary',
        }],
      }))
    .Project({
      id: 1,
      coursePackage: ArrayElemAt('$coursePackage', 0),
      school: ArrayElemAt('$school', 0),
    })
    .getPipeline();
 */

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
            coursePackageTopicRule: 1,
            allottedMentor: 1,
          },
        },
        {
          $lookup: {
            from: 'Topic',
            let: {
              topicIds: {
                $ifNull: ['$coursePackageTopicRule.topic.typeId', []],
              },
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
                  topicAssignmentQuestions: {
                    assignmentQuestions: {
                      id: 1,
                    },
                  },
                  chapter: 1,
                  topicComponentRule: 1,
                  classType: 1,
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
                  topicAssignmentQuestions: {
                    assignmentQuestions: {
                      id: 1,
                    },
                  },
                  chapter: {
                    $arrayElemAt: [
                      '$chapter',
                      0,
                    ],
                  },
                  topicComponentRule: 1,
                  classType: 1,
                },
              },
            ],
            as: 'coursePackageTopicArr',
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
                  enrollmentType: 1,
                  latestSessionStatus: 1,
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
                        topicAssignmentQuestions: {
                          assignmentQuestions: {
                            id: 1,
                          },
                        },
                        chapter: 1,
                        topicComponentRule: 1,
                        classType: 1,
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
                        topicAssignmentQuestions: {
                          assignmentQuestions: {
                            id: 1,
                          },
                        },
                        chapter: {
                          $arrayElemAt: [
                            '$chapter',
                            0,
                          ],
                        },
                        topicComponentRule: 1,
                        classType: 1,
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
            coursePackageTopicRule: 1,
            coursePackageTopicArr: 1,
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

export const getTopicOrderFromCoursePackage = (coursePackage, currentTopic, userBatchDetails) => {
  if (currentTopic) {
    const currentTopicId = get(currentTopic, 'id');
    let packageTopics = get(coursePackage, 'topics', []);
    if (userBatchDetails && get(userBatchDetails, 'coursePackageTopicRule', []).length) {
      packageTopics = get(userBatchDetails, 'coursePackageTopicRule', []);
    }
    const filteredTopic = packageTopics.find((el) => get(el, 'topic.typeId') === currentTopicId);
    const packageTopicOrder = get(filteredTopic, 'order', 0);
    let packageTopicTitle = get(currentTopic, 'title');
    let packageTopicDescription = get(currentTopic, 'description');
    if (get(filteredTopic, 'title')) {
      packageTopicTitle = get(filteredTopic, 'title');
    }
    if (get(filteredTopic, 'description')) {
      packageTopicDescription = get(filteredTopic, 'description');
    }
    return { order: packageTopicOrder, title: packageTopicTitle, description: packageTopicDescription };
  }
  return { order: get(currentTopic, 'order', 0), title: get(currentTopic, 'title', ''), description: get(currentTopic, 'description', '') };
};

export const getTopicsArrFromCoursePackages = (coursePackage = {}, returnType = 'topics', userBatchDetails) => {
  // a batch can have a seperate course Package rule which if exists overrides the course package .
  let packageTopics = get(coursePackage, 'topicsArr', []);
  if (get(userBatchDetails, 'coursePackageTopicRule', []).length) {
    packageTopics = get(userBatchDetails, 'coursePackageTopicArr', []);
  }
  /**
   * if returnType is chapters we construct chapters array
   * with topics mapped to that chapter from package.
   */
  if (returnType === 'chapters') {
    const chapterToTopicMap = {};
    (packageTopics || []).forEach((topic) => {
      if (chapterToTopicMap[get(topic, 'chapter.id')]) {
        chapterToTopicMap[get(topic, 'chapter.id')].push({
          ...topic,
          ...getTopicOrderFromCoursePackage(coursePackage, topic, userBatchDetails),
        });
      } else {
        chapterToTopicMap[get(topic, 'chapter.id')] = [{
          ...topic,
          ...getTopicOrderFromCoursePackage(coursePackage, topic, userBatchDetails),
        }];
      }
    });
    return Object.keys(chapterToTopicMap).map((chapterId) => ({
      id: chapterId,
      title: get(chapterToTopicMap[chapterId], '0.chapter.title'),
      order: get(chapterToTopicMap[chapterId], '0.chapter.order'),
      topics: (chapterToTopicMap[chapterId] || []),
    }));
  }
  /**
   * if returnType is topics we just return topics array from package.
   */
  const updatedTopicsArr = [];
  (packageTopics || []).forEach((topic) => {
    updatedTopicsArr.push({
      ...topic,
      ...getTopicOrderFromCoursePackage(coursePackage, topic, userBatchDetails),
    });
  });
  return updatedTopicsArr.sort((a, b) => a.order - b.order);
};

const constructSessionsArr = ({
  lastTopicBookedOrder,
  lastTopicSessionStatus,
  chapter,
  topic,
  batchSessions,
  combinedEnrollmentType,
  mentorMenteeSessions,
  bookedSession,
  packageLastTopicId,
}) => {
  const { id: chapterId, title: chapterTitle, order: chapterOrder } = chapter;
  // if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
  // if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
  // if (topic.projects && topic.projects.length) {
  //   topic.projects.forEach((project) => {
  //     projects.push(project);
  //   });
  // }

  const {
    order: topicOrder,
    id: topicId,
    title: topicTitle,
    description: topicDescription,
    thumbnail: topicThumbnail,
    classType,
    thumbnailSmall: topicThumbnailSmall,
    isTrial,
  } = topic;
  let completedSessionObj;
  let bookedSessionObj;
  let upComingSessionObj;
  let mentorData;
  const isAccessible = isTopicAccessible(combinedEnrollmentType, isTrial);
  // checking logic for topics which are yet not booked by mentee
  if (topicOrder >= lastTopicBookedOrder) {
    const batchSessionArray = batchSessions
      && batchSessions.filter((item) => item.topic && item.topic.id === topicId);
    if (batchSessionArray && batchSessionArray.length) {
      const batchSession = batchSessionArray[0];
      let slotTime = null;
      const { bookingDate, mentorSession, sessionEndDate } = batchSession;
      const {
        id: batchSessionTopicId,
        title: batchSessionTopicTitle,
        description: batchSessionTopicDescription,
        thumbnail: batchSessionTopicThumbnail,
        thumbnailSmall: batchSessionTopicThumbnailSmall,
        isTrial: batchSessionIsTrial,
      } = batchSession.topic;

      const isBatchTopicAccessible = isTopicAccessible(
        combinedEnrollmentType,
        batchSessionIsTrial,
      );

      slotTimes.forEach((time, index) => {
        if (batchSession[time]) {
          slotTime = index;
        }
      });
      // checking logic if topic is already consumed or yet to be watched
      if (
        topicOrder === lastTopicBookedOrder
        && lastTopicSessionStatus === sessionStatus.completed
      ) {
        const completedMenteeSession = {
          topicId,
          topicOrder,
          topicTitle,
          topicThumbnail,
          topicThumbnailSmall,
          topicDescription,
          isAccessible,
          chapterId,
          chapterTitle,
          chapterOrder,
          classType,
          endingDate: sessionEndDate,
          mentorId:
            mentorSession && mentorSession.user && mentorSession.user.id,
          mentorName:
            mentorSession && mentorSession.user && mentorSession.user.name,
          mentorProfilePic:
            mentorSession
            && mentorSession.user
            && mentorSession.user.profilePic,
        };
        completedSessionObj = completedMenteeSession;
      } else {
        const bookedMenteeSession = {
          topicId: batchSessionTopicId,
          topicOrder,
          topicTitle: batchSessionTopicTitle,
          classType,
          topicThumbnail: batchSessionTopicThumbnail,
          topicThumbnailSmall: batchSessionTopicThumbnailSmall,
          topicDescription: batchSessionTopicDescription,
          bookingDate,
          slotTime,
          isAccessible: isBatchTopicAccessible,
          chapterId,
          chapterTitle,
          chapterOrder,
        };
        if (get(mentorSession, 'user')) {
          mentorData = getMentorData(get(mentorSession, 'user'));
        }
        if (bookedSession.length) {
          upComingSessionObj = bookedMenteeSession;
        } else {
          bookedSessionObj = bookedMenteeSession;
        }
      }
    } else {
      const upComingMenteeSession = {
        topicId,
        topicOrder,
        classType,
        topicTitle,
        topicThumbnail,
        topicThumbnailSmall,
        topicDescription,
        isAccessible,
        chapterId,
        chapterTitle,
        chapterOrder,
      };
      if (
        topicId === packageLastTopicId
        && lastTopicSessionStatus === sessionStatus.completed
      ) {
        completedSessionObj = upComingMenteeSession;
      } else if (bookedSession.length) {
        upComingSessionObj = upComingMenteeSession;
      } else {
        bookedSessionObj = upComingMenteeSession;
      }
    }
  } else {
    let mentorSession;
    let sessionDate;
    let isSubmittedForReview = false;
    mentorMenteeSessions.forEach((mentorMenteeSession) => {
      if (
        mentorMenteeSession.topic
        && mentorMenteeSession.topic.id === topicId
      ) {
        mentorSession = mentorMenteeSession.mentorSession;
        isSubmittedForReview = mentorMenteeSession.isSubmittedForReview || false;
        sessionDate = mentorMenteeSession.sessionEndDate
          || mentorMenteeSession.sessionStartDate;
      }
    });
    const completedMenteeSession = {
      topicId,
      topicOrder,
      topicTitle,
      classType,
      topicThumbnail,
      topicThumbnailSmall,
      topicDescription,
      isAccessible,
      isSubmittedForReview,
      chapterId,
      chapterTitle,
      chapterOrder,
      endingDate: sessionDate,
      mentorId: mentorSession && mentorSession.user && mentorSession.user.id,
      mentorName:
        mentorSession && mentorSession.user && mentorSession.user.name,
      mentorProfilePic:
        mentorSession && mentorSession.user && mentorSession.user.profilePic,
    };
    completedSessionObj = completedMenteeSession;
  }
  return {
    completedSessionObj,
    upComingSessionObj,
    bookedSessionObj,
    mentorData,
  };
};

/*
This is called when mentee tries to load homepage
It will return all the booked and upcoming sessions based on User current topic component status
and sessions booked so far by a mentee which is in MenteeSession
It also returns the total no. of topics and chapters
bookedSession -> only next 1 session will come here
upComingSession -> all the sessions after booked session will come here
completedSession -> all completed session will come here
*/
const menteeCourseSyllabusMutationResolver = async (
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

  const {
    userIdFromContext: userId,
  } = userAndAppInfo;
  let batchCurrentComponentInfo;
  let schoolInfo;
  let currentTopicComponentInfo;
  let menteeSessions;
  let userBatchDetails;
  let mentorMenteeSessions;
  let batchSessions;
  const upComingSession = [];
  const bookedSession = [];
  const completedSession = [];
  let prevTopicComponentRule = [];
  let prevTopicId;
  let lastTopicBookedOrder = 0;
  let lastCompletedTopicOrder = 0;
  let isPaid = false;
  let coursePackage;
  // let currentTopicOrder;
  // const projects = [];
  let mentorData = {};
  let firstComponent = {};

  // if we get userId through token, then we will return syllabus for that user
  if (userId) {
    const userCurrentCompModel = new QueryController('UserCurrentTopicComponentStatus', { bypass: true });
    const userCurrentTopicComponentStatusesRes = await userCurrentCompModel.aggregate(getUserCurrentTopicComponentStatusAggregation(userId, courseId));
    // const res = await callLocalGraphqlApi(
    //   getUserCurrentTopicComponentStatus(userId, courseId),
    //   context,
    //   '',
    // );

    const userBatchDetailsRes = new QueryController('StudentProfile', { bypass: true });
    userBatchDetails = await userBatchDetailsRes.aggregate(getUserBatchDetails(userId));
    let courseOrPackageFilter = {
      'course.typeId': courseId || OLD_COURSE_ID,
    };
    if (get(userBatchDetails, '0.batch.coursePackage.id')) {
      coursePackage = get(userBatchDetails, '0.batch.coursePackage', {});
      courseOrPackageFilter = {
        'coursePackage.typeId': get(coursePackage, 'id'),
      };
    }
    // currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
    currentTopicComponentInfo = userCurrentTopicComponentStatusesRes[0] || {};
    // calling method to validate user current topic component status
    if (!coursePackage) {
      validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
    }
    // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
    // const batchRes = await callLocalGraphqlApi(
    //   getBatchStatus(userId),
    //   context,
    //   '',
    // );
    const batchCurrentComponentCourseId = get(userBatchDetails, '0.batch.currentComponent.currentCourse.id');

    if (
      (courseId && batchCurrentComponentCourseId === courseId)
      || !courseId
      || get(coursePackage, 'id')
    ) {
      batchCurrentComponentInfo = get(userBatchDetails, '0.batch.currentComponent');
      schoolInfo = get(userBatchDetails, '0.school');
      const allottedMentor = get(userBatchDetails, '0.batch.allottedMentor');
      if (allottedMentor && allottedMentor.name) {
        mentorData = getMentorData(allottedMentor);
      }
    }
    // const getMentorMenteeSessionsRes = await callLocalGraphqlApi(getMentorMenteeSessions(userId, courseId));
    // mentorMenteeSessions = get(getMentorMenteeSessionsRes, 'data.mentorMenteeSessions');

    const modelQuery = new QueryController('MentorMenteeSession', { bypass: true });
    mentorMenteeSessions = await modelQuery.aggregate([
      {
        $match: {
          sessionStatus: 'completed',
          ...courseOrPackageFilter,
        },
      },
      {
        $project: {
          id: 1,
          isSubmittedForReview: 1,
          topic: 1,
          sessionEndDate: 1,
          sessionStartDate: 1,
          sessionStatus: 1,
          menteeSession: 1,
          mentorSession: 1,
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
          from: 'MentorSession',
          let: {
            mentorSession: '$mentorSession.typeId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$id', '$$mentorSession'],
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
                  {
                    $lookup: {
                      from: 'File',
                      let: {
                        profilePic: '$profilePic.typeId',
                      },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: ['$id', '$$profilePic'],
                            },
                          },
                        },
                      ],
                      as: 'profilePic',
                    },
                  },
                  {
                    $project: {
                      id: 1,
                      name: 1,
                      profilePic: {
                        $arrayElemAt: ['$profilePic', 0],
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
          as: 'mentorSession',
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
                      order: 1,
                      title: 1,
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
          isSubmittedForReview: 1,
          topic: {
            $arrayElemAt: ['$topic', 0],
          },
          sessionEndDate: 1,
          sessionStartDate: 1,
          sessionStatus: 1,
          menteeSession: {
            $arrayElemAt: ['$menteeSession', 0],
          },
          mentorSession: {
            $arrayElemAt: ['$mentorSession', 0],
          },
        },
      },
    ]);
    // log(`DATA ${JSON.stringify(mongoData)}`);
    // menteeSessions and mentorMenteeSessions will be called if user is not from batch
    if (batchCurrentComponentInfo) {
      const batchId = get(userBatchDetails, '0.batch.id');
      const batchSessionModel = new QueryController('BatchSession', {
        bypass: true,
      });
      batchSessions = await batchSessionModel.aggregate(getBatchSessionsAggregation(batchId, courseId, courseOrPackageFilter));
      // currentTopicOrder = get(batchCurrentComponentInfo, 'currentTopic.order');
    } else {
      // const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, courseId));
      const menteeSessionsModel = new QueryController('MenteeSession', { bypass: true });
      menteeSessions = await menteeSessionsModel.aggregate(getMenteeSessionAggregation(userId, courseId, courseOrPackageFilter));
      // currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');

      if (mentorMenteeSessions && mentorMenteeSessions.length) {
        const allottedMentorModel = new QueryController('SalesOperation', {
          bypass: true,
        });
        const allottedMentorRes = await allottedMentorModel.aggregate(allotedMentorAggregation(userId, courseId));
        const allottedMentor = get(allottedMentorRes, '0.allottedMentor');
        if (allottedMentor && allottedMentor.name) {
          mentorData = getMentorData(allottedMentor);
        }
      }

      if (!mentorData.name) {
        const allottedMentorFromMMSModel = new QueryController('MentorMenteeSession', {
          bypass: true,
        });
        const allottedMentorFromMMSQueryRes = await allottedMentorFromMMSModel.aggregate(allotedMentorFromMMSAggregation(userId, courseId, courseOrPackageFilter));
        const allottedMentor = get(allottedMentorFromMMSQueryRes[0], 'mentorSession.user');
        if (allottedMentor && allottedMentor.name) {
          mentorData = getMentorData(allottedMentor);
        }
      }
    }
    /*
    If user is not logged in and asking for course syllabus then we will not add
    any document in Db and will return default data with first topic as unlocked
    */
  } else {
    const topic = await getFirstTopicAndLearningObjective('userCourseSyllabus', courseId);
    const firstTopic = get(topic, 'data.topics[0]');
    // const firstLearningObjective = get(topic, 'data.topics[0].learningObjectives[0]');
    if (!firstTopic) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'FirstTopic is not present',
        },
      });
    }
    // if (!firstLearningObjective) {
    //   throw new DatabaseRecordNotFoundError({
    //     data: {
    //       error: 'FirstTopicId.firstLearningObjective: is not present',
    //     },
    //   });
    // }
    // const courseResult = await callLocalGraphqlApi(getCourseQuery(courseId));
    const courseModel = new QueryController('MentorMenteeSession', { bypass: true });
    const course = await courseModel.aggregate(getCourseAggregation(courseId));
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python',
        },
      });
    }
    // constructing data when a not logged in user fetches userCourseSyllabus
    currentTopicComponentInfo = {
      currentCourse: course[0],
      currentTopic: firstTopic,
      enrollmentType: enrollmentTypes.free,
    };
    // Setting topic order as -1 and currentTopicComponentType as video for guest user,
    // this way all inactive images will be returned
    // currentTopicOrder = -1;
  }

  const {
    currentCourse,
  } = currentTopicComponentInfo;

  let combinedEnrollmentType = get(currentTopicComponentInfo, 'enrollmentType', enrollmentTypes.free);

  if (batchCurrentComponentInfo) {
    const batchEnrollmentType = get(batchCurrentComponentInfo, 'enrollmentType', enrollmentTypes.free);
    combinedEnrollmentType = (combinedEnrollmentType === enrollmentTypes.free && batchEnrollmentType === enrollmentTypes.free) ? enrollmentTypes.free : enrollmentTypes.pro;
  }
  if (schoolInfo) {
    const schoolEnrollmentType = get(schoolInfo, 'enrollmentType', enrollmentTypes.free);
    combinedEnrollmentType = (combinedEnrollmentType === enrollmentTypes.free && schoolEnrollmentType === enrollmentTypes.free ? enrollmentTypes.free : enrollmentTypes.pro);
  }
  // this object will be returned in output
  const currentUserSyllabus = {};
  let totalChapters = 0;
  let totalTopics = 0;
  const { chapters } = currentCourse;
  let packageTopics = [];
  if (coursePackage && get(coursePackage, 'id')) {
    packageTopics = getTopicsArrFromCoursePackages(coursePackage, 'topics', get(userBatchDetails, '0.batch'));
  }
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
  // if user belongs to a batch, the syllbaus will be calculated on basis of batchCurrentComponentStatus
  if (batchCurrentComponentInfo) {
    const {
      currentTopic,
      latestSessionStatus,
    } = batchCurrentComponentInfo;
    lastTopicBookedOrder = currentTopic && currentTopic.order;
    const lastTopicSessionStatus = latestSessionStatus;
    totalChapters += chapters.length;
    // iterating over chapters to construct data for homepage

    if (coursePackage && get(coursePackage, 'id')) {
      lastTopicBookedOrder = getTopicOrderFromCoursePackage(coursePackage, currentTopic, get(userBatchDetails, '0.batch')).order;
      const packageLastTopicId = get(packageTopics[packageTopics.length - 1], 'id');
      packageTopics.forEach((topic) => {
        const constructedSessionsArr = constructSessionsArr({
          lastTopicBookedOrder,
          lastTopicSessionStatus,
          chapter: {
            id: get(coursePackage, 'id'),
            title: get(coursePackage, 'title', 'Package'),
            order: 1,
          },
          topic,
          batchSessions,
          combinedEnrollmentType,
          mentorMenteeSessions,
          completedSession,
          upComingSession,
          bookedSession,
          packageLastTopicId,
        });
        if (get(constructedSessionsArr, 'completedSessionObj')) {
          completedSession.push(get(constructedSessionsArr, 'completedSessionObj', {}));
        }
        if (get(constructedSessionsArr, 'upComingSessionObj')) {
          upComingSession.push(get(constructedSessionsArr, 'upComingSessionObj', {}));
        }
        if (get(constructedSessionsArr, 'bookedSessionObj')) {
          bookedSession.push(get(constructedSessionsArr, 'bookedSessionObj', {}));
        }
        if (get(constructedSessionsArr, 'mentorData')) {
          mentorData = get(constructedSessionsArr, 'mentorData');
        }
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
        const chapterTopics = chapter.topics;
        chapterTopics.sort((a, b) => a.order - b.order);
        totalTopics += chapterTopics.length;
        // iterating over topics of each chapter  and setting isUnlocked field
        chapterTopics.forEach((topic) => {
          const constructedSessionsArr = constructSessionsArr({
            lastTopicBookedOrder,
            lastTopicSessionStatus,
            chapter,
            topic,
            batchSessions,
            combinedEnrollmentType,
            mentorMenteeSessions,
            completedSession,
            upComingSession,
            bookedSession,
          });
          if (get(constructedSessionsArr, 'completedSessionObj')) {
            completedSession.push(get(constructedSessionsArr, 'completedSessionObj', {}));
          }
          if (get(constructedSessionsArr, 'upComingSessionObj')) {
            upComingSession.push(get(constructedSessionsArr, 'upComingSessionObj', {}));
          }
          if (get(constructedSessionsArr, 'bookedSessionObj')) {
            bookedSession.push(get(constructedSessionsArr, 'bookedSessionObj', {}));
          }
          if (get(constructedSessionsArr, 'mentorData')) {
            mentorData = get(constructedSessionsArr, 'mentorData');
          }
        });
      });
    }
  } else {
    // iterating over each of mentorMenteeSessions to send sessions that are already completed by mentee
    if (mentorMenteeSessions && mentorMenteeSessions.length) {
      mentorMenteeSessions.forEach((mentorMenteeSession) => {
        const {
          sessionEndDate,
          sessionStartDate,
          mentorSession,
          isSubmittedForReview,
          menteeSession,
        } = mentorMenteeSession;
        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          chapter,
        } = mentorMenteeSession.topic;

        // setting last topic completed order, will use this to find booked sessions that are not completed
        if (topicOrder > lastCompletedTopicOrder) {
          lastCompletedTopicOrder = topicOrder;
        }

        const completedMenteeSession = {
          topicId,
          topicOrder,
          topicTitle,
          topicThumbnail,
          topicThumbnailSmall,
          topicDescription,
          isSubmittedForReview,
          menteeSessionId: get(menteeSession, 'id'),
          endingDate: sessionEndDate || sessionStartDate,
          chapterId: chapter && chapter.id,
          chapterTitle: chapter && chapter.title,
          chapterOrder: chapter && chapter.order,
          mentorId: mentorSession && mentorSession.user && mentorSession.user.id,
          mentorName: mentorSession && mentorSession.user && mentorSession.user.name,
          mentorProfilePic: mentorSession && mentorSession.user && mentorSession.user.profilePic,
        };
        completedSession.push(completedMenteeSession);
      });
    }

    // iterating over each of MenteeSessions to send sessions that are already booked and not yet completed by mentee
    if (menteeSessions && menteeSessions.length) {
      menteeSessions.forEach((menteeSession) => {
        let slotTime = null;
        const {
          bookingDate,
        } = menteeSession;
        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          isTrial,
          chapter,
        } = menteeSession.topic;

        const isAccessible = isTopicAccessible(combinedEnrollmentType, isTrial);

        // setting last topic booked order, will use this to find upcoming sessions
        if (topicOrder > lastTopicBookedOrder) {
          lastTopicBookedOrder = topicOrder;
        }

        slotTimes.forEach((time, index) => {
          if (menteeSession[time]) {
            slotTime = index;
          }
        });
        // checking logic if topic is already consumed or yet to be watched
        if (
          topicOrder > lastCompletedTopicOrder
        ) {
          const bookedMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            bookingDate,
            slotTime,
            isAccessible,
            menteeSessionId: get(menteeSession, 'id'),
            chapterId: chapter && chapter.id,
            chapterTitle: chapter && chapter.title,
            chapterOrder: chapter && chapter.order,
          };
          if (bookedSession.length) {
            upComingSession.push(bookedMenteeSession);
          } else {
            bookedSession.push(bookedMenteeSession);
          }
        }
      });
    }

    totalChapters += chapters.length;
    // iterating over chapters to construct data for homepage
    chapters.forEach((chapter) => {
      if (!chapter || !chapter.topics || !chapter.topics.length) {
        throw new DatabaseRecordNotFoundError({
          data: {
            error: 'CurrentCourse.chapter.topics: is not present',
          },
        });
      }
      const chapterTopics = chapter.topics;
      chapterTopics.sort((a, b) => a.order - b.order);
      totalTopics += chapterTopics.length;
      // iterating over topics of each chapter  and setting isUnlocked field
      chapterTopics.forEach((topic) => {
        const { id: chapterId, title: chapterTitle, order: chapterOrder } = chapter;
        // if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
        // if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
        // if (topic.projects && topic.projects.length) {
        //   topic.projects.forEach((project) => {
        //     projects.push(project);
        //   });
        // }
        const {
          order: topicOrder,
          id: topicId,
          title: topicTitle,
          description: topicDescription,
          thumbnail: topicThumbnail,
          thumbnailSmall: topicThumbnailSmall,
          isTrial,
        } = topic;
        /* eslint-disable no-use-before-define */
        const isAccessible = isTopicAccessible(combinedEnrollmentType, isTrial);
        // checking logic for topics which are yet not booked by mentee
        if (
          topicOrder > lastTopicBookedOrder
        ) {
          const upComingMenteeSession = {
            topicId,
            topicOrder,
            topicTitle,
            topicThumbnail,
            topicThumbnailSmall,
            topicDescription,
            isAccessible,
            chapterId,
            chapterTitle,
            chapterOrder,
          };
          upComingSession.push(upComingMenteeSession);
        }
      });
    });
  }
  if (combinedEnrollmentType === enrollmentTypes.pro) {
    isPaid = true;
  }

  /* // calling method to get all published badges
  const badgeRes = await callLocalGraphqlApi(getBadgeQuery(courseId));
  const skillsFromBadgeInfo = get(badgeRes, 'data.badges');
  skillsFromBadgeInfo.forEach((badge) => {
    if (
      !badge
      || !badge.type
      || !badge.topic
      || !badge.name
      || !badge.order
      || !badge.unlockPoint
      || !badge.topic.order) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Badge: Wrong/Incomplete information stored in badge',
        },
      });
    }
  });
  // sorting each badge array according to topic order
  skillsFromBadgeInfo.sort((a, b) => a.topic.order - b.topic.order);

  // getting parsed characters and equipments to be sent in result
  const skills = parseBadges(
    sortBadges(skillsFromBadgeInfo),
    currentTopicOrder,
  ); */

  const courseData = {
    title: currentCourse.title,
    description: currentCourse.description,
    bannerTitle: currentCourse.bannerTitle,
    bannerDescription: currentCourse.bannerDescription,
    badgeDescription: currentCourse.badgeDescription,
    chapterCount: totalChapters,
    topicCount: totalTopics,
    courseCompletionPercentage: totalTopics ? Math.round(((completedSession.length * 100) / totalTopics) * 100) / 100 : 0,
  };

  if (bookedSession && bookedSession.length) {
    const bookedTopicId = bookedSession[0].topicId || '';
    if (bookedTopicId) {
      const {
        video, blockBasedPractice, blockBasedProject,
      } = topicTypes;
      if (!courseId || (courseId === OLD_COURSE_ID)) {
        firstComponent = {
          componentName: video,
          componentId: bookedTopicId,
        };
      } else {
        const topicRes = await fetchOrCacheQueryRes({
          hkey: `mcs_tQNC_${bookedTopicId}`,
          maxAge: 86400,
          dbCallback: () => callLocalGraphqlApi(
            getTopicQueryNewCourse(bookedTopicId),
            context,
            '',
          ),
        });
        // getting info of called topic
        const topicInfo = get(topicRes, 'data.topic');
        if (!topicInfo) {
          throw new DatabaseRecordNotFoundError({
            data: {
              error: 'Topic is not present',
            },
          });
        }

        const topicComponentRule = topicInfo.topicComponentRule;
        if (topicComponentRule && topicComponentRule.length) {
          const sortedTopicComponentRule = topicComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order);
          let componentId = '';
          let childComponentName = null;
          if (sortedTopicComponentRule[0].componentName === video) {
            componentId = sortedTopicComponentRule[0].video && sortedTopicComponentRule[0].video.id;
          } else if (sortedTopicComponentRule[0].componentName === 'learningObjective') {
            componentId = sortedTopicComponentRule[0].learningObjective && sortedTopicComponentRule[0].learningObjective.id;
            if (currentCourse && sortedTopicComponentRule[0].learningObjective && get(currentCourse, 'defaultLoComponentRule', []).length) {
              const learningObjectiveComponentsRule = (get(sortedTopicComponentRule[0], 'learningObjectiveComponentsRule', []) || []);
              const filteredLoComponent = getFilteredLoComponentRule(
                sortedTopicComponentRule[0].learningObjective, get(currentCourse, 'defaultLoComponentRule', []), learningObjectiveComponentsRule,
              );
              if (filteredLoComponent && filteredLoComponent.length) {
                childComponentName = get(filteredLoComponent[0], 'componentName', 'comicStrip');
              }
            }
          } else if (sortedTopicComponentRule[0].componentName === blockBasedPractice) {
            componentId = sortedTopicComponentRule[0].blockBasedProject && sortedTopicComponentRule[0].blockBasedProject.id;
          } else if (sortedTopicComponentRule[0].componentName === blockBasedProject) {
            componentId = sortedTopicComponentRule[0].blockBasedProject && sortedTopicComponentRule[0].blockBasedProject.id;
          }
          firstComponent = {
            componentName: sortedTopicComponentRule[0].componentName,
            childComponentName,
            componentId,
          };
        } else {
          // in case topicComponentRule is not present, handling the case and sending video
          firstComponent = {
            componentName: video,
            componentId: bookedTopicId,
          };
        }
        /** getting topicComponentRule of previous topic homework */
        if (completedSession && completedSession.length) {
          const bookedTopicOrder = bookedSession[0].topicOrder || '';
          let prevCompletedSession = {};
          if (coursePackage) {
            prevCompletedSession = completedSession.sort((a, b) => get(b, 'topicOrder') - get(a, 'topicOrder')).filter((session) => get(session, 'classType') !== 'theory');
          } else {
            prevCompletedSession = completedSession.filter((session) => get(session, 'topicOrder') === (bookedTopicOrder - 1));
          }
          if (prevCompletedSession && prevCompletedSession.length) {
            const prevSessionTopicId = prevCompletedSession[0].topicId || '';
            const prevTopicRes = await fetchOrCacheQueryRes({
              hkey: `mcs_PtQNC_${prevSessionTopicId}`,
              maxAge: 86400,
              dbCallback: () => callLocalGraphqlApi(
                getTopicQueryNewCourse(prevSessionTopicId),
                context,
                '',
              ),
            });
            const prevTopicInfo = get(prevTopicRes, 'data.topic');
            // getting info of called prev topic
            if (prevTopicInfo && prevTopicInfo.topicComponentRule) {
              prevTopicComponentRule = prevTopicInfo.topicComponentRule;
              prevTopicId = prevSessionTopicId;
            }
          }
        }
      }
    }
  }
  Object.assign(currentUserSyllabus, {
    upComingSession,
    bookedSession,
    completedSession,
    totalChapters,
    totalTopics,
    isPaid,
    // skills,
    course: courseData,
    // projects,
    mentor: mentorData,
    firstComponent,
    previousTopic: {
      topicComponentRule: prevTopicComponentRule,
      topicId: prevTopicId,
    },
  });
  return currentUserSyllabus;
};

export default menteeCourseSyllabusMutationResolver;
