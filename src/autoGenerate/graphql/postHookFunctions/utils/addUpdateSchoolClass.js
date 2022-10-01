import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const getSchoolClass = async (input, studentSchoolId, context) => {
  const {
    grade,
    section,
  } = input;
  const query = `
  query{
  schoolClasses(filter:{
    and:[
      {school_some:{id:"${studentSchoolId}"}}
      {grade:${grade}}
      {section: ${section}}
    ]
  }){
    id
  }
}
  `;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.schoolClasses.0.id');
};

const addSchoolClass = async (input, studentSchoolId, studentProfileId, context) => {
  const query = `
    mutation($input: SchoolClassInput!){
      addSchoolClass(
      input:$input, 
      schoolConnectId:"${studentSchoolId}"
      studentsConnectIds:["${studentProfileId}"]
      ){
        id
      }
    }
  `;
  const { grade, section } = input;
  const variables = {
    input: {
      grade,
      section,
    },
  };
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.addSchoolClass.id');
};

const connectSchoolClassWithStudentProfile = async (schoolClassId, studentSchoolId, studentProfileId, context) => {
  const query = `
    mutation($input: SchoolClassUpdate){
      updateSchoolClass(
      id:"${schoolClassId}"
      input:$input, 
      studentsConnectIds:["${studentProfileId}"]
      ){
        id
      }
    }
  `;
  const variables = {
    input: {},
  };
  const res = await callLocalGraphqlApi(query, context, variables);
  return get(res, 'data.updateSchoolClass.id');
};

const addUpdateSchoolClass = async (input, studentSchoolId, studentProfileId, context) => {
  const schoolClassId = await getSchoolClass(input, studentSchoolId, context);
  // map student profile with school class if exist else create first and then map
  if (schoolClassId) {
    // just connect school class and student profile
    return connectSchoolClassWithStudentProfile(schoolClassId, studentSchoolId, studentProfileId, context);
  }
  return addSchoolClass(input, studentSchoolId, studentProfileId, context);
};

export default addUpdateSchoolClass;
