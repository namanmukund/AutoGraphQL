import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const studentProfileQuery = async (id, context) => {
  const query = `
    query{
      studentProfile(id:"${id}"){
        id
        grade
        section
        profileAvatarCode
        user {
          id
        }
        batch {
          id
          course {
            id
          }
          coursePackage {
            courses {
              id
            }
          }
        }
        batches {
          id
          course {
            id
          }
          coursePackage {
            courses {
              id
            }
          }
        }

        schoolClass {
        id
        grade
        section
        }
      }
    }`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.studentProfile');
};

const updateStudentProfileValidation = async (params, _, context) => {
  const { id } = params;
  const studentProfileData = await studentProfileQuery(id, context);
  if (!get(studentProfileData, 'id')) {
    throw new DatabaseRecordNotFoundError();
  }
  if (get(params, 'input.rollNo')) {
    Object.assign(params.input, {
      rollNo: get(params, 'input.rollNo').toLowerCase(),
    });
  }
  context.previousDocument = studentProfileData;
};

export default updateStudentProfileValidation;
