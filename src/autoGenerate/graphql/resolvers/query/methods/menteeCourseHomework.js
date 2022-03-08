/* eslint-disable */

import { get } from 'lodash';
import {
    enrollmentTypes,
    GLOBAL_COURSE_TITLE,
    PUBLISHED,
    slotTimes,
    sessionStatus, blockBasedProjectType, OLD_COURSE_ID, topicTypes,
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
    if (isTopicFree) {
        return true;
    }
    return false;
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

//aggregation to get fetch current component status of user
const getUserCurrentTopicComponentStatus = (courseId, userId) => [
    {
        $match: {
            'user.typeId': userId,
            'currentCourse.typeId': courseId,
            'currentCourse.status': { $eq: PUBLISHED },
            'currentCourse.title': { $eq: GLOBAL_COURSE_TITLE },

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
                            chapterStatus: PUBLISHED,
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$status', '$$chapterStatus'],
                                    },
                                },
                            },
                            {
                                $project: {
                                    id: 1,
                                    title: 1,
                                    order: 1,
                                    topics: 1
                                },
                            },
                            {
                                $lookup: {
                                    from: 'Topic',
                                    let: {
                                        topicStatus: PUBLISHED,
                                        topicCourseId: courseId,
                                    },
                                    pipeline: [
                                        {
                                            $match: {
                                                $and: [
                                                    {
                                                        $expr: {
                                                            $eq: ['$status', '$$chapterStatus'],
                                                        },
                                                    },
                                                    {
                                                        $expr: {
                                                            $eq: ['$course.id', '$$topicCourseId'],
                                                        },
                                                    }
                                                ],
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

// query to get chapters and topics belonging to a course
const getCourseQuery = (courseId) => `
    query{
      courses(filter:{
        ${courseId ? `id: "${courseId}"` : `and:[{title: "${GLOBAL_COURSE_TITLE}"}, {status: ${PUBLISHED}}]`}
      }){
        id
        title
        description
        badgeDescription
        defaultLoComponentRule {
          componentName
          order
        }
        chapters(
            filter: {
              status: ${PUBLISHED}
            }
          ){
          id
          title
          order
          topics(
            filter: {
              and:[
                {
                  status:${PUBLISHED}
                }
                {
                  courses_some:{
                    ${courseId ? `id: "${courseId}"` : `and:[ {status: ${PUBLISHED}}, {title: "${GLOBAL_COURSE_TITLE}"}]`}
                  }
                }
              ]
            }
          ){
            id
            title
            order
            isTrial
            description
            isTrial
            thumbnail{
              id
              uri
              name
            }
            thumbnailSmall{
              id
              uri
              name
            }
            projectCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.project}}{status: ${PUBLISHED} }]}){
              count
            }
            practiceCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.practice}}{status: ${PUBLISHED}}]}){
              count
            }
          }
        }
      }
    }
  `;

// query to get mentee Sessions
const getMenteeSessionAggregation = (userId, courseId) => [
    {
        $match: {
            'user.typeId': userId,
            'course.typeId': courseId || OLD_COURSE_ID,
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

const getBatchSessionsAggregation = (batchId, courseId) => [
    {
        $match: {
            'batch.typeId': batchId,
            'course.typeId': courseId || OLD_COURSE_ID,
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
const allotedMentorFromMMSAggregation = (userId, courseId) => [
    {
        $match: {
            'course.typeId': courseId || OLD_COURSE_ID,
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

/** Fitler DefaultLoComponentRule based on Lo meta */
const getFilteredLoComponentRule = (learningObjective, loComponentRule) => {
    if (loComponentRule && loComponentRule.length && learningObjective) {
        return (
            loComponentRule.sort((firstItem, secondItem) => firstItem.order - secondItem.order)
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

/*
This is called when mentee tries to load homepage
It will return all the booked and upcoming sessions based on User current topic component status
and sessions booked so far by a mentee which is in MenteeSession
It also returns the total no. of topics and chapters
bookedSession -> only next 1 session will come here
upComingSession -> all the sessions after booked session will come here
completedSession -> all completed session will come here
*/
const menteeCourseHomework = async (
    root,
    params,
    typeName,
    info,
    ast,
    context,
) => {
    const mcsMRTime = process.hrtime();
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
    // let currentTopicOrder;
    let projectCount = 0;
    let practiceCount = 0;
    // const projects = [];
    let mentorData = {};
    let firstComponent = {};

    // if we get userId through token, then we will return syllabus for that user
    if (userId) {
        const userCurrentTopicComponentStatusesModel = getTypeQueryController('UserCurrentTopicComponentStatus');
        const res = await fetchOrCacheQueryRes({
            hkey: `mcs_UCTCS_${courseId}_${userId}`,
            maxAge: '2000',
            dbCallback: async () => await userCurrentTopicComponentStatusesModel.aggregate(
                getUserCurrentTopicComponentStatus(
                    courseId, userId
                )
            ),
        });

        currentTopicComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0]');
        // calling method to validate user current topic component status
        validateCurrentTopicComponent(currentTopicComponentInfo, mutationName);
        // checking if user belongs to a batch if he does everthing will be calculated on basis of batch
        // const batchRes = await callLocalGraphqlApi(
        //   getBatchStatus(userId),
        //   context,
        //   '',
        // );
        const batchCurrentComponentCourseId = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.currentComponent.currentCourse.id');

        if ((courseId && batchCurrentComponentCourseId === courseId) || !courseId) {
            batchCurrentComponentInfo = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.currentComponent');
            schoolInfo = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.school');
            const allottedMentor = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.allottedMentor');
            if (allottedMentor && allottedMentor.name) {
                mentorData = getMentorData(allottedMentor);
            }
        }

        const getMentorMenteeSessionsRes = await callLocalGraphqlApi(getMentorMenteeSessions(userId, courseId));
        mentorMenteeSessions = get(getMentorMenteeSessionsRes, 'data.mentorMenteeSessions');

        const modelQuery = new QueryController('MentorMenteeSession', { bypass: true });
        mentorMenteeSessions = await modelQuery.aggregate([
            {
                $match: {
                    sessionStatus: 'completed',
                    'course.typeId': courseId || OLD_COURSE_ID,
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
            const batchId = get(res, 'data.userCurrentTopicComponentStatuses[0].user.studentProfile.batch.id');
            const batchSessionModel = new QueryController('BatchSession', {
                bypass: true,
            });
            batchSessions = await batchSessionModel.aggregate(getBatchSessionsAggregation(batchId, courseId));
            // currentTopicOrder = get(batchCurrentComponentInfo, 'currentTopic.order');
        } else {
            // const graphlStart = process.hrtime();
            // const getMenteeSessionsRes = await callLocalGraphqlApi(getMenteeSessions(userId, courseId));
            // const graphlStop = process.hrtime(graphlStart);
            // log(`Time Taken to execute graphql query : ${(graphlStop[0] * 1e9 + graphlStop[1]) / 1e9} seconds`);
            const menteeSessionsModel = new QueryController('MenteeSession', { bypass: true });
            menteeSessions = await menteeSessionsModel.aggregate(getMenteeSessionAggregation(userId, courseId));
            // currentTopicOrder = get(currentTopicComponentInfo, 'currentTopic.order');

            if (mentorMenteeSessions && mentorMenteeSessions.length) {
                const allottedMentorModel = new QueryController('SalesOperation', {
                    bypass: true,
                });
                const allottedMentorRes = await allottedMentorModel.aggregate(allotedMentorAggregation(userId, courseId));
                const allottedMentor = get(allottedMentorRes, 'allottedMentor');
                if (allottedMentor && allottedMentor.name) {
                    mentorData = getMentorData(allottedMentor);
                }
            }

            if (!mentorData.name) {
                const allottedMentorFromMMSModel = new QueryController('MentorMenteeSession', {
                    bypass: true,
                });
                const allottedMentorFromMMSQueryRes = await allottedMentorFromMMSModel.aggregate(allotedMentorFromMMSAggregation(userId, courseId));
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
        const courseResult = await fetchOrCacheQueryRes({
            hkey: `mcs_CQ_${courseId}`,
            dbCallback: () => callLocalGraphqlApi(getCourseQuery(courseId)),
        });
        const course = get(courseResult, 'data.courses');
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
    if (!chapters || !chapters.length) {
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
                if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
                if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
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

                const isAccessible = isTopicAccessible(combinedEnrollmentType, isTrial);
                // checking logic for topics which are yet not booked by mentee
                if (
                    topicOrder >= lastTopicBookedOrder
                ) {
                    const batchSessionArray = batchSessions && batchSessions.filter((item) => item.topic && item.topic.id === topicId);

                    if (batchSessionArray && batchSessionArray.length) {
                        const batchSession = batchSessionArray[0];
                        let slotTime = null;
                        const {
                            bookingDate,
                            mentorSession,
                            sessionEndDate,
                        } = batchSession;
                        const {
                            order: batchSessionTopicOrder,
                            id: batchSessionTopicId,
                            title: batchSessionTopicTitle,
                            description: batchSessionTopicDescription,
                            thumbnail: batchSessionTopicThumbnail,
                            thumbnailSmall: batchSessionTopicThumbnailSmall,
                            isTrial: batchSessionIsTrial,
                        } = batchSession.topic;

                        const isBatchTopicAccessible = isTopicAccessible(combinedEnrollmentType, batchSessionIsTrial);

                        slotTimes.forEach((time, index) => {
                            if (batchSession[time]) {
                                slotTime = index;
                            }
                        });
                        // checking logic if topic is already consumed or yet to be watched
                        if (topicOrder === lastTopicBookedOrder && lastTopicSessionStatus === sessionStatus.completed) {
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
                                endingDate: sessionEndDate,
                                mentorId: mentorSession && mentorSession.user && mentorSession.user.id,
                                mentorName: mentorSession && mentorSession.user && mentorSession.user.name,
                                mentorProfilePic: mentorSession && mentorSession.user && mentorSession.user.profilePic,
                            };
                            completedSession.push(completedMenteeSession);
                        } else {
                            const bookedMenteeSession = {
                                topicId: batchSessionTopicId,
                                topicOrder: batchSessionTopicOrder,
                                topicTitle: batchSessionTopicTitle,
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
                                upComingSession.push(bookedMenteeSession);
                            } else {
                                bookedSession.push(bookedMenteeSession);
                            }
                        }
                    } else {
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
                        if (bookedSession.length) {
                            upComingSession.push(upComingMenteeSession);
                        } else {
                            bookedSession.push(upComingMenteeSession);
                        }
                    }
                } else {
                    let mentorSession;
                    let sessionDate;
                    let isSubmittedForReview = false;
                    mentorMenteeSessions.forEach((mentorMenteeSession) => {
                        if (mentorMenteeSession.topic && mentorMenteeSession.topic.id === topicId) {
                            mentorSession = mentorMenteeSession.mentorSession;
                            isSubmittedForReview = mentorMenteeSession.isSubmittedForReview || false;
                            sessionDate = mentorMenteeSession.sessionEndDate || mentorMenteeSession.sessionStartDate;
                        }
                    });
                    const completedMenteeSession = {
                        topicId,
                        topicOrder,
                        topicTitle,
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
                        mentorName: mentorSession && mentorSession.user && mentorSession.user.name,
                        mentorProfilePic: mentorSession && mentorSession.user && mentorSession.user.profilePic,
                    };
                    completedSession.push(completedMenteeSession);
                }
            });
        });
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
                if (topic.projectCount && topic.projectCount.count) projectCount += topic.projectCount.count;
                if (topic.practiceCount && topic.practiceCount.count) practiceCount += topic.practiceCount.count;
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
        projectCount,
        practiceCount,
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
                            const filteredLoComponent = getFilteredLoComponentRule(sortedTopicComponentRule[0].learningObjective, get(currentCourse, 'defaultLoComponentRule', []));
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
                    const prevCompletedSession = completedSession.filter((session) => get(session, 'topicOrder') === (bookedTopicOrder - 1));
                    if (prevCompletedSession && prevCompletedSession.length) {
                        const prevSessionTopicId = prevCompletedSession[0].topicId || '';
                        const prevTopicRes = await callLocalGraphqlApi(
                            getTopicQueryNewCourse(prevSessionTopicId),
                            context,
                            '',
                        );
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
    const mcsMRTimeStop = process.hrtime(mcsMRTime);
    log(`Time Taken to execute mcsMR : ${(mcsMRTimeStop[0] * 1e9 + mcsMRTimeStop[1]) / 1e9} seconds`);
    return currentUserSyllabus;
};

export default menteeCourseHomework;
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
//             projectCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.project}}{status: ${PUBLISHED} }]}){
//               count
//             }
//             practiceCount: blockBasedProjectsMeta(filter:{and:[{type: ${blockBasedProjectType.practice}}{status: ${PUBLISHED}}]}){
//               count
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