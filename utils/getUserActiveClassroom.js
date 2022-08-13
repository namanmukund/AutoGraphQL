import { get } from 'lodash';
import { callLocalGraphqlApi } from '../src/api';

export const activeClassroomIdFromContext = (context) => get(context, 'activeClassroom.id');

const getStudentProfile = async (context) => {
  const { currentUser } = context;
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
  return get(studentProfile, 'data.studentProfiles[0]');
};

const getUserBatchesArray = async (context, studentProfileData) => {
  let studentProfile = studentProfileData;
  if (!studentProfile) studentProfile = await getStudentProfile(context);
  const userBatches = [...get(studentProfile, 'batches', [])];
  if (get(studentProfile, 'batch') && !userBatches.find((batch) => get(batch, 'id') === get(studentProfile, 'batch.id'))) userBatches.push(get(studentProfile, 'batch'));
  return userBatches || [];
};

const getActiveClassroomBasedOnCourses = async (context, { courseId, userBatches: batches }, defaultClassroomId) => {
  let userBatches = batches;
  if (!batches) userBatches = await getUserBatchesArray(context);
  if (!courseId && !defaultClassroomId) return userBatches[0];
  if (get(userBatches, 'coursePackage.courses', []).length) {
    return userBatches.find((batch) => get(batch, 'coursePackage.courses', []).includes(courseId));
  }
  return userBatches.find((batch) => get(batch, 'course.id') === courseId);
};

export const getActiveClassroomId = async (context, { courseId, userBatches }, defaultClassroomId) => {
  let classroomId = activeClassroomIdFromContext(context);
  if (!classroomId) {
    const classroom = await getActiveClassroomBasedOnCourses(context, { courseId, userBatches }, defaultClassroomId);
    classroomId = get(classroom, 'id');
  }
  return classroomId || defaultClassroomId;
};

const getUserActiveClassroom = async (context, { courseId, studentProfile }, defaultClassroomId) => {
  const userBatches = await getUserBatchesArray(context, studentProfile);
  const activeClassroomId = await getActiveClassroomId(context, { courseId, userBatches }, defaultClassroomId);
  return userBatches.find((batch) => get(batch, 'id') === activeClassroomId);
};

export default getUserActiveClassroom;
