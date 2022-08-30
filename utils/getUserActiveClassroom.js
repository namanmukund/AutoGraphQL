import { get } from 'lodash';
import { callLocalGraphqlApi } from '../src/api';
import { RedisController } from '../src/autoGenerate/graphql/controllers';

export const activeClassroomIdFromContext = (context) => get(context, 'activeClassroom');

const getStudentProfile = async (context) => {
  const { currentUser } = context;
  if (get(currentUser, 'id')) {
    const redisCon = new RedisController({ bypass: true });
    const cachedData = await redisCon.get(`user_active_classroom_student_profile_${get(currentUser, 'id')}`);
    if (cachedData && get(cachedData, 'id')) return cachedData;
    const studentProfile = await callLocalGraphqlApi(
      `{
        studentProfiles(filter: {
          user_some:{
            id: "${get(currentUser, 'id')}"
          }
        }) {
          id 
          batches {
            id
            type
            documentType
            code
            classroomTitle
            course {
              id
            }
            coursePackage {
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
            course {
              id
            }
            coursePackage {
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
    redisCon.set(get(studentProfile, 'data.studentProfiles[0]'), { hkey: `user_active_classroom_student_profile_${get(currentUser, 'id')}`, maxAge: 60 });
    return get(studentProfile, 'data.studentProfiles[0]');
  }
  return null;
};

const getUserBatchesArray = async (context, studentProfileData) => {
  try {
    let studentProfile = studentProfileData;
    if (!studentProfile) studentProfile = await getStudentProfile(context);
    const userBatches = [...get(studentProfile, 'batches', [])];
    if (get(studentProfile, 'batch') && !userBatches.find((batch) => get(batch, 'id') === get(studentProfile, 'batch.id'))) userBatches.push({ ...get(studentProfile, 'batch'), isDefault: true });
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
    return defaultBatch || userBatches[0];
  }
  let batchBasedOnCourse = userBatches.find((batch) => get(batch, 'course.id') === courseId);
  (userBatches || []).forEach((batch) => {
    const doesCourseExists = get(batch, 'coursePackage.courses', []).map((course) => get(course, 'id')).includes(courseId);
    if (doesCourseExists) batchBasedOnCourse = batch;
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
