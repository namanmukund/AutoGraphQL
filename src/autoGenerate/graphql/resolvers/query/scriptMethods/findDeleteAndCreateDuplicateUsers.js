/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../../api';

const callParentChildSignup = async (input, schoolName, country) => {
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
  parentChildSignUp(input: $input){
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
  const SCHOOL_ID = 'clf6mrs23066w0tlw1qd24cq3';
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
  const schoolUserEmailIds = [];
  for (const user of schoolUsers) {
    const childrens = get(user, 'parentProfile.children', []);
    if (childrens && childrens.length > 1) {
      const [child1, child2] = childrens;
      const child1CreatedAt = new Date(get(child1, 'createdAt'));
      const child2CreatedAt = new Date(get(child2, 'createdAt'));
      if (child1CreatedAt > child2CreatedAt) duplicateUsers.push(child2);
      else duplicateUsers.push(child1);
    }
    schoolUserEmailIds.push(get(user, 'email'));
  }
  const index = 0;
  for (const child of duplicateUsers) {
    const studentId = get(child, 'id');
    const studentDetailRes = await callLocalGraphqlApi(`{
        studentProfile(id: "${studentId}") {
            id
            grade
            section
            rollNo
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
    const { code, name: schoolName, studentsMeta: { count } } = schoolDetail;
    const academicYearId = get(academicYears, '[0].id');
    const email = `${code}${count}@tekie.in`;
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
      schoolName,
      parentPassword,
    };
    await callParentChildSignup(input, schoolName);
  }
};

export default findDeleteAndCreateDuplicateUsers;
