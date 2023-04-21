import { get } from 'lodash';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { CacheController } from '../controllers';
import addUpdateSchoolClass from './utils/addUpdateSchoolClass';
import purgeUserActiveProfileCache from './utils/purgeUserActiveProfileCache';
import { updateStudentProfile, userBatchQuery } from './utils/updateStudentBatchUtils';

const updateUserApprovedCodeQuery = async (userApprovedCodeID, input, context) => {
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
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateUserApprovedCode');
};

const userApprovedCodeQuery = async (userId, context) => {
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
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.userApprovedCodes');
};

const removeFromSchoolCLassStudentProfile = async (schoolClassId, studentProfileId, context) => {
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
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.removeFromSchoolClassStudentProfile.fieldName');
};

const removeOldLinkAndAddUpdateSchoolClass = async (previousSchoolClassId, input, studentSchoolId, studentProfileId, context, academicYearId) => {
  await removeFromSchoolCLassStudentProfile(previousSchoolClassId, studentProfileId, context);
  return addUpdateSchoolClass(input, studentSchoolId, studentProfileId, context, academicYearId);
};

// const removeOldLinkAndAddUpdateNewBatch = async (prevBatchId, input, studentSchoolId, studentProfileId, context) => {
// await removeStudentFromBatch(studentProfileId, prevBatchId, context);
//   return addStudentToBatch(input, studentSchoolId, studentProfileId, context);
// };

const getStudentProfile = async (userId, context) => {
  const query = `{
  studentProfiles(filter: { user_some: { id: "${userId}" } }) {
    id
    batch {
      id
    }
    batches {
      id
    }
  }
}
`;
  const result = await callLocalGraphqlApi(query, context);
  return get(result, 'data.studentProfiles[0]');
};

const removeStudentFromBatch = async (batchId, studentId, context) => {
  const query = `
  mutation{
    removeFromBatchStudentProfile(studentProfileId:"${studentId}", batchId:"${batchId}"){
      studentProfile{
        id
      }
    }
  }
  `;
  const res = await callLocalGraphqlApi(query, context);
  console.log('res ... ', res);
  return null;
};

const removeBatchesFromStudent = async (studentId, context) => {
  const query = `
  mutation{
    removeBatchesFromStudent(studentProfileId:"${studentId}"){
      result
    }
  }
  `;
  const res = await callLocalGraphqlApi(query, context);
  console.log('res ... ', res);
  return null;
};

const updateStudentProfilePostHookMethod = async (input, params, mutationName, context) => {
  const userId = get(context, 'previousDocument.user.id');
  const academicYearId = get(input, 'academicYears[0].typeId');
  if (get(params, 'input.profileAvatarCode') !== get(context, 'previousDocument.profileAvatarCode')) {
    const userApprovedCodes = await userApprovedCodeQuery(userId, context);
    const updateObj = {
      studentAvatar: get(input, 'profileAvatarCode', 'theo'),
    };
    if (userApprovedCodes && userApprovedCodes.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const userApprovedCode of userApprovedCodes) {
        const userApprovedCodeID = get(userApprovedCode, 'id');
        // eslint-disable-next-line no-await-in-loop
        await updateUserApprovedCodeQuery(userApprovedCodeID, updateObj, context);
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
  const currentSection = get(input, 'section');
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
        context,
        academicYearId,
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
        context,
        academicYearId,
      );
      Object.assign(input, { schoolClass: { type: 'SchoolClass', typeId: schoolClassId } });
    }
  }
  if (schoolId) {
    let isGradeOrSectionUpdated = false;
    if (currentGrade && previousGrade !== currentGrade) {
      isGradeOrSectionUpdated = true;
    }
    if (currentSection && previousSection !== currentSection) {
      isGradeOrSectionUpdated = true;
    }
    if (isGradeOrSectionUpdated) {
      const studentProfile = await getStudentProfile(userId);
      console.log('student profile ', studentProfile)
      const studentProfileBatchId = get(studentProfile, 'batch.id');
      const studentProfileId = get(studentProfile, 'id');
      console.log('student profile batch ', studentProfileBatchId, studentProfileId)
      // await removeStudentFromBatch(studentProfileBatchId, studentProfileId, context);
      // await removeBatchesFromStudent(studentProfileId, context);

      // const batches = await userBatchQuery(schoolId, currentGrade, currentSection, academicYearId);
      // console.log('batches ... ', batches);
      // if (batches && batches.length > 0) {
      //   const studentId = get(input, 'id');
      //   const inHeritedBatch = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) !== null);
      //   let masterbatchId = '';
      //   let batchesConnectIds = [];
      //   if (inHeritedBatch.length > 0) {
      //     const masterBatch = batches.filter((batch) => get(batch, 'id') === get(inHeritedBatch, '[0].inheritedFrom.id'));
      //     masterbatchId = get(masterBatch, '[0].id');
      //     const remainingInheritedBatches = batches.filter((batch) => get(batch, 'inheritedFrom.id', null) === masterbatchId);
      //     batchesConnectIds = remainingInheritedBatches.length > 0 && remainingInheritedBatches.map((item) => get(item, 'id'));
      //   } else {
      //     masterbatchId = get(batches, '[0].id');
      //   }
      //   updateStudentProfile(studentId, masterbatchId, batchesConnectIds);
      // }

      // const studentBatchId = get(context, 'previousDocument.batch.id');
      // removeOldLinkAndAddUpdateNewBatch(studentBatchId, {
      //   grade: currentGrade, section: currentSection,
      // }, schoolId, get(input, 'id'), context);
    }
  }

  await purgeUserActiveProfileCache(context);
  if (get(params, 'batchConnectId') || get(params, 'batchesConnectIds', []).length) {
    const cacheController = new CacheController({ bypass: true });
    cacheController.destroy(`user::studentProfile::batches::${userId}`);
  }
};

export default updateStudentProfilePostHookMethod;
