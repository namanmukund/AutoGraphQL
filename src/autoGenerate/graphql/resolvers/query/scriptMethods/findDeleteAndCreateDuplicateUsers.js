/* eslint-disable no-console */
/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get, sortBy } from 'lodash';
import { PARENT } from '../../../../../../constants/roles';
import { callLocalGraphqlApi } from '../../../../../api';

const callParentChildSignup = async (input, schoolName, academicYearId) => {
  const {
    childName,
    parentName,
    rollNo,
    parentEmail,
    grade,
    section,
    parentPassword,
  } = input;
  const query = `
mutation($input: ParentChildSignUpInput){
  parentChildSignUp(input: $input, ${academicYearId ? `academicYearId: "${academicYearId}"` : ''}){
    id
    parentProfile{
      id
      children{
        id
        school{
          id
          name
        }
        user{
          id
        }
      }
    }
  }
}
`;
  const variables = {
    input: {
      parentName,
      childName,
      parentEmail,
      grade,
      section,
      rollNo,
      schoolName,
      parentPassword,
    },
  };

  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.parentChildSignUp');
};

const deleteUser = async (userId) => {
  await callLocalGraphqlApi(`mutation{
    deleteUser(id:"${userId}"){
      id
    }
  }`);
};

const addParentUser = async (input, context) => {
  const addUserQuery = `mutation {
  addUser(input: {
    name: "${input.name}"
    email:"${input.email}"
    role: ${input.role}
    password:"${input.password}"
  }) {
    id
  }
}
`;
  const addUserRes = await callLocalGraphqlApi(addUserQuery, context);
  const userConnectId = get(addUserRes, 'data.addUser.id');
  const addParentProfileQuery = `mutation {
    addParentProfile(input: {}, userConnectId: "${userConnectId}") {
      id
    }
  }
  `;
  const addParentProfileRes = await callLocalGraphqlApi(addParentProfileQuery, context);
  return get(addParentProfileRes, 'data.addParentProfile.id');
};

const getUserWithSameEmail = async (emailOrUsername, context) => {
  const filter = `{email:"${emailOrUsername}"}`;
  const query = `{
  users(filter: { and: [${filter}] }) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.users', []).length;
};

const removeFromStudentProfileParentProfile = async (parentProfileId, studentProfileId, context) => {
  const removeStudent = await callLocalGraphqlApi(`mutation {
  removeFromStudentProfileParentProfile(
    studentProfileId: "${studentProfileId}"
    parentProfileId: "${parentProfileId}"
  ) {
    typeName
  }
}`, context);
  return get(removeStudent, 'data.removeFromStudentProfileParentProfile.typeName');
};

const updateStudentProfile = async (studentProfileId, parentProfileId, context) => {
  const studentProfileRes = await callLocalGraphqlApi(`mutation {
  updateStudentProfile(id: "${studentProfileId}", input: {}, parentsConnectIds: ["${parentProfileId}"]) {
    id
  }
}
`, context);
  return get(studentProfileRes, 'data.updateStudentProfile.id');
};

const getUniqueEmail = async (email, schoolUserEmailIds = [], index, initialEmail, context) => {
  const isEmailAlreadyGenerated = schoolUserEmailIds.find((emailVal) => emailVal === email);
  if (!isEmailAlreadyGenerated) {
    const isUserAlreadyExist = await getUserWithSameEmail(email, context);
    if (!isUserAlreadyExist) return email;
  }
  const emailVal = email.replace('@tekie.in', '');
  const newIndex = Number(emailVal.replace(initialEmail, '').toLowerCase() || 0) + 1;
  const newemail = `${initialEmail + newIndex}@tekie.in`;
  return await getUniqueEmail(newemail, schoolUserEmailIds, newIndex, initialEmail, context);
};

const findDeleteAndCreateDuplicateUsers = async (context) => {
  const SCHOOL_ID = 'clerchs0305h70uhm4fjz7tsc';
  const schoolDetailRes = await callLocalGraphqlApi(`{
  school(id: "${SCHOOL_ID}") {
    id
    code
    name
    studentsMeta {
      count
    }
  }
}
`);
  const schoolUsersRes = await callLocalGraphqlApi(`{users(
    filter: {
      and: [
        { role: parent }
        {
          parentProfile_some: {
            children_some: { school_some: { id: "${SCHOOL_ID}" } }
          }
        }
      ]
    }
  ) {
    id
    email
    parentProfile {
      children {
        id
        createdAt
        user{
            id
        }
      }
    }
  }}`, context);
  const duplicateUsers = [];
  const schoolUsers = get(schoolUsersRes, 'data.users');
  const schoolDetail = get(schoolDetailRes, 'data.school');
  const { code, name: schoolName, studentsMeta: { count } } = schoolDetail;
  const schoolUserEmailIds = [];
  for (const user of schoolUsers) {
    const childrens = get(user, 'parentProfile.children', []);
    if (childrens && childrens.length > 1) {
      const childrensArray = sortBy(childrens, 'createdAt');
      const [_, ...rest] = childrensArray;
      console.log({ rest: rest.length });
      duplicateUsers.push(...rest);
    }
    schoolUserEmailIds.push(get(user, 'email'));
  }
  let index = 0;
  const createdUsers = [];
  const notCreatedUsers = [];
  for (const child of duplicateUsers) {
    console.log(`Processing Index: ${index}========`);
    const studentId = get(child, 'id');
    const studentDetailRes = await callLocalGraphqlApi(`{
        studentProfile(id: "${studentId}") {
            id
            grade
            section
            rollNo
            parents{
              id
            }
            academicYears{
              id
            }
            user {
                name
            }
        }
        }
        `);
    const studentDetail = get(studentDetailRes, 'data.studentProfile');
    const {
      grade, section, rollNo, user: { name }, academicYears,
    } = studentDetail;
    const prevParentProfileId = get(studentDetail, 'parents[0].id');
    const studentProfileId = get(studentDetail, 'id');
    const academicYearId = get(academicYears, '[0].id');
    const email = `${code}${schoolUsers.length + 1}@tekie.in`;
    const parentEmail = await getUniqueEmail(email, schoolUserEmailIds, index, code, context);
    schoolUserEmailIds.push(parentEmail);
    const parentPassword = parentEmail && parentEmail.trim().toLowerCase().split('@')[0];
    const input = {
      parentName: `${name} parent`,
      childName: name,
      parentEmail,
      grade,
      section,
      rollNo: rollNo || '',
      parentPassword,
    };
    console.log({ input: JSON.stringify(input), prevParentProfileId, studentProfileId });
    try {
      // await callParentChildSignup(input, schoolName, academicYearId).then(async (res) => {
      //   await deleteUser(get(child, 'user.id'));
      //   createdUsers.push(res);
      // });
      const parentData = {
        name: input.parentName,
        email: parentEmail && parentEmail.trim().toLowerCase(),
        role: PARENT,
        password: parentPassword,
      };
      const parentProfileId = await addParentUser(parentData, context);
      console.log({ parentProfileId });
      if (parentProfileId) {
        const removeProfileMapping = await removeFromStudentProfileParentProfile(prevParentProfileId, studentProfileId, context);
        console.log({ removeProfileMapping });
        if (removeProfileMapping) {
          const updatedStudentProfileId = await updateStudentProfile(studentProfileId, parentProfileId, context);
          if (updatedStudentProfileId) {
            console.log({ updatedStudentProfileId });
            createdUsers.push(updatedStudentProfileId);
          }
        }
      }
    } catch (err) {
      notCreatedUsers.push(input);
      console.log('Something went wrong', err);
    }
    index += 1;
  }
  console.log({
    createdUsers: createdUsers.length,
    duplicateUsers: duplicateUsers.length,
    notCreatedUsers: notCreatedUsers.length,
    studentsMeta: count,
    schoolUsers: schoolUsers.length,
    totalStudentsAfterUpdate: schoolUsers.length + duplicateUsers.length,
  });
  console.log(JSON.stringify(notCreatedUsers));
};

export default findDeleteAndCreateDuplicateUsers;
