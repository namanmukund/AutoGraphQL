import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';

const updateUserApprovedCodeQuery = async (userApprovedCodeID, input) => {
  const query = `
    mutation($input:UserApprovedCodeUpdate!){
      updateUserApprovedCode(
        id:"${userApprovedCodeID}"
        input: $input,
      ){
        id
      }
    }`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateUserApprovedCode');
};

const userApprovedCodeQuery = async (userId) => {
  const query = `
      query{
        userApprovedCodes(filter: {
            and: [
                {status: published},
                {user_some: { id: "${userId}" } }
            ]
        }) {
          id
        }
      }`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.userApprovedCodes');
};

const removeFromSchoolCLassStudentProfile = async (schoolClassId, studentProfileId) => {
  const query = `
  mutation{
    removeFromSchoolClassStudentProfile(
      studentProfileId:"${studentProfileId}", 
      schoolClassId:"${schoolClassId}"
    ){
      fieldName
    }
  }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.removeFromSchoolClassStudentProfile.fieldName');
};

const removeOldLinkAndAddUpdateSchoolClass = async (previousSchoolClassId, input, studentSchoolId, studentProfileId) => {
  await removeFromSchoolCLassStudentProfile(previousSchoolClassId, studentProfileId);
  return addUpdateSchoolClass(input, studentSchoolId, studentProfileId);
};

const updateStudentProfilePostHookMethod = async (input, params, mutationName, context) => {
  if (get(params, 'input.profileAvatarCode') !== get(context, 'previousDocument.profileAvatarCode')) {
    const userId = get(context, 'previousDocument.user.id');
    const userApprovedCodes = await userApprovedCodeQuery(userId);
    const updateObj = {
      studentAvatar: get(input, 'profileAvatarCode', 'theo'),
    };
    if (userApprovedCodes && userApprovedCodes.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const userApprovedCode of userApprovedCodes) {
        const userApprovedCodeID = get(userApprovedCode, 'id');
        // eslint-disable-next-line no-await-in-loop
        await updateUserApprovedCodeQuery(userApprovedCodeID, updateObj);
      }
    }
  }
  // section and schoolClass
  /*
  --section added
  --section updated
  --grade changed
   */
  const previousGrade = get(context, 'previousDocument.grade');
  const previousSection = get(context, 'previousDocument.section');
  const currentSection = get(params, 'input.section');
  const currentGrade = input.grade;
  const schoolId = get(input, 'school.typeId');
  const previousSchoolClassId = get(input, 'schoolClass.typeId');
  //  section added
  if (!previousSection && currentSection) {
    if (schoolId) {
      const schoolClassId = await addUpdateSchoolClass(
        {
          grade: currentGrade,
          section: currentSection,
        },
        schoolId,
        input.id,
      );
      Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
    }
  } else if (
    previousSchoolClassId
        && (
          (previousGrade === currentGrade && previousSection && currentSection && previousSection !== currentSection)
            || (previousGrade !== currentGrade && currentSection)
        )
  ) {
    // remove previous linking and follow the same procedure
    if (schoolId) {
      const schoolClassId = await removeOldLinkAndAddUpdateSchoolClass(
        previousSchoolClassId, {
          grade: currentGrade,
          section: currentSection,
        },
        schoolId,
        input.id,
      );
      Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
    }
  }
};

export default updateStudentProfilePostHookMethod;
