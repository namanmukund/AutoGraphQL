import { get } from 'lodash';
import { callLocalGraphqlApi } from '../src/api';
import { CacheController } from '../src/autoGenerate/graphql/controllers';

const USER_PROFILE_EXPIRY_TIME = 86400; // 1 day

export const activeClassroomIdFromContext = (context) => get(context, 'activeClassroom');

export const activeCourseIdFromContext = (context) => get(context, 'activeCourse');

const userProfileCacheKey = (userId) => `userProfile::activeClassroom::${userId}`;

const getStudentProfile = async (context) => {
  const { currentUser } = context;
  if (get(currentUser, 'id')) {
    const cacheCon = new CacheController({ bypass: true });
    const cachedData = await cacheCon.get(userProfileCacheKey(get(currentUser, 'id')));
    if (cachedData && get(cachedData, 'id')) return cachedData;
    const studentProfile = await callLocalGraphqlApi(
      `{
        studentProfiles(filter: {
          user_some:{
            id: "${get(currentUser, 'id')}"
          }
        }) {
          id 
          batches(orderBy:createdAt_DESC) {
            id
            type
            documentType
            code
            classroomTitle
            coursePackageCourses {
              id
            }
            batchCourse: course {
              id
            }
            batchCoursePackage: coursePackage {
              id
              courses {
                id
              }
            }
          }
          batch {
            id
            code
            type
            documentType
            classroomTitle
            batchCourse: course {
              id
            }
            batchCoursePackage: coursePackage {
              id
              courses {
                id
              }
            }
          }
        }
      }`,
      context,
    );
    cacheCon.set(get(studentProfile, 'data.studentProfiles[0]'), { hkey: userProfileCacheKey(get(currentUser, 'id')), maxAge: USER_PROFILE_EXPIRY_TIME });
    return get(studentProfile, 'data.studentProfiles[0]');
  }
  return null;
};

const getBatchArrayFromStudentProfile = (studentProfile) => {
  const userBatches = [...get(studentProfile, 'batches', [])];
  if (get(studentProfile, 'batch') && !userBatches.find((batch) => get(batch, 'id') === get(studentProfile, 'batch.id'))) userBatches.push({ ...get(studentProfile, 'batch'), isDefault: true });
  return userBatches;
};

const getUserBatchesArray = async (context, studentProfileData) => {
  try {
    const studentProfile = await getStudentProfile(context);
    let userBatches = getBatchArrayFromStudentProfile(studentProfile);
    const userBatchesArrayFromProfile = getBatchArrayFromStudentProfile(studentProfileData);
    if (studentProfileData) {
      userBatches = userBatches.map((batch) => {
        const batchFromProfile = userBatchesArrayFromProfile.find((batchFromProfileRes) => get(batchFromProfileRes, 'id') === get(batch, 'id'));
        if (batchFromProfile) return { ...batch, ...batchFromProfile };
        return batch;
      });
    }
    return userBatches || [];
  } catch {
    return [];
  }
};

const getActiveClassroomBasedOnCourses = async (context, { courseId, userBatches: batches }, defaultClassroomId) => {
  let userBatches = batches;
  if (!batches) userBatches = await getUserBatchesArray(context);

  const defaultBatchFromId = (userBatches || []).find((batch) => get(batch, 'id') === defaultClassroomId);
  const defaultBatch = (userBatches || []).find((batch) => get(batch, 'isDefault'));
  if (!courseId && !defaultClassroomId) {
    return defaultBatch || defaultBatchFromId || userBatches[0];
  }
  let batchBasedOnCourse = userBatches.find((batch) => get(batch, 'batchCourse.id') === courseId);
  (userBatches || []).forEach((batch) => {
    const doesCourseExistsInBatchRule = get(batch, 'coursePackageCourses', []).map((course) => get(course, 'id')).includes(courseId);
    const doesCourseExists = get(batch, 'batchCoursePackage.courses', []).map((course) => get(course, 'id')).includes(courseId);
    if (doesCourseExists || doesCourseExistsInBatchRule) batchBasedOnCourse = batch;
  });
  return batchBasedOnCourse || defaultBatchFromId || defaultBatch || userBatches[0];
};

export const getActiveClassroomId = async (context, { courseId, userBatches }, defaultClassroomId) => {
  try {
    let classroomId = activeClassroomIdFromContext(context);
    if (!classroomId) {
      const classroom = await getActiveClassroomBasedOnCourses(context, { courseId, userBatches }, defaultClassroomId);
      classroomId = get(classroom, 'id');
    }
    return classroomId || defaultClassroomId;
  } catch {
    return defaultClassroomId;
  }
};

const getUserActiveClassroom = async (context, { courseId, studentProfile }, defaultClassroomId) => {
  const userBatches = await getUserBatchesArray(context, studentProfile);
  const activeClassroomId = await getActiveClassroomId(context, { courseId, userBatches }, defaultClassroomId);
  return userBatches.find((batch) => get(batch, 'id') === activeClassroomId);
};

export default getUserActiveClassroom;
