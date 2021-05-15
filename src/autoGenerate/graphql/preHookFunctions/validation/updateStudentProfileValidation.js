import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../constants/errors';

const studentProfileQuery = async (id) => {
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
        schoolClass {
        id
        grade
        section
        }
      }
    }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.studentProfile');
};

const updateStudentProfileValidation = async (params, _, context) => {
  const { id } = params;
  const studentProfileData = await studentProfileQuery(id);
  if (!get(studentProfileData, 'id')) {
    throw new DatabaseRecordNotFoundError();
  }
  context.previousDocument = studentProfileData;
};

export default updateStudentProfileValidation;
