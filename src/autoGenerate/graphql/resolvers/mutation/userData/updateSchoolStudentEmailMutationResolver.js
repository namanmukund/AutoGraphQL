/* eslint-disable no-console */
/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { UnauthorizedOperationError } from '../../../../../../constants/errors';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import { log } from '../../../../../../utils';
import { callLocalGraphqlApi } from '../../../../../api';
import { QueryController } from '../../../controllers';

const STUDENTPROFILE_TYPE = 'StudentProfile';

const getStudentAggregation = ({
  schoolId,
}) => [
  {
    $match: {
      'school.typeId': schoolId,
    },
  },
  {
    $lookup: {
      from: 'ParentProfile',
      let: {
        parentsId: '$parents.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ['$id', '$$parentsId'],
            },
          },
        },
        {
          $lookup: {
            from: 'User',
            localField: 'user.typeId',
            foreignField: 'id',
            as: 'parentUser',
          },
        },
        {
          $project: {
            id: 1,
            parentUser: {
              id: 1,
              email: 1,
              savedPassword: 1,
              name: 1,
            },
          },
        },
      ],
      as: 'parentProfile',
    },
  },
  {
    $lookup: {
      from: 'User',
      localField: 'user.typeId',
      foreignField: 'id',
      as: 'user',
    },
  },
  {
    $project: {
      id: 1,
      grade: 1,
      section: 1,
      rollNo: 1,
      user: {
        id: 1,
        savedPassword: 1,
        email: 1,
        name: 1,
      },
      parentProfile: 1,
    },
  },
];

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getSchoolDetail = async (schoolId, context) => {
  const query = `{
  school(id:"${schoolId}"){
    id
    code
  }
}`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.school');
};

const getMenteeWithEmail = async (email, context) => {
  const query = `{
  users(filter: { and: [{ role: mentee }, { email: "${email}" }] }) {
    id
  }
}
`;
  const res = await callLocalGraphqlApi(query, context);
  return get(res, 'data.users', []).length;
};

const updateMenteeUser = async (userId, input, context) => {
  const updateQuery = `mutation($input: UserUpdate) {
  updateUser(id: "${userId}", input: $input) {
    id
  }
}`;
  const res = await callLocalGraphqlApi(updateQuery, context, { input });
  return get(res, 'data.updateUser.id');
};

const getUniqueEmail = async (email = '', studentProfiles = [], index, emailPreFix, context) => {
  const isAlreadyGenerated = studentProfiles.find((student) => student['New Email'] === email);
  const isUserAlreadyExist = await getMenteeWithEmail(email, context);
  if (!isAlreadyGenerated && !isUserAlreadyExist) {
    return email;
  }
  const newIndex = index + 1;
  const newEmail = email.replace(email, `${emailPreFix}${newIndex}`).toLowerCase();
  return await getUniqueEmail(newEmail, studentProfiles, newIndex, emailPreFix, context);
};

const updateSchoolStudentEmail = async (root, params, authentication, context) => {
  const { schoolId } = params;
  const currentUser = authentication && authentication.user;
  if (!currentUser) {
    throw new UnauthorizedOperationError();
  }
  if (!schoolId) {
    throw new MissingMandatoryInputInRequestError({
      data: {
        message: 'School Id`s is missing in input',
      },
    });
  }
  const StudentsModel = getTypeQueryController(
    STUDENTPROFILE_TYPE,
  );

  const studentProfilesResponse = await StudentsModel.aggregate(
    getStudentAggregation({
      schoolId,
    }),
  );
  if (!studentProfilesResponse || !studentProfilesResponse.length) {
    throw new Error('No Student Exists');
  }
  const schoolDetail = await getSchoolDetail(schoolId, context);
  const schoolCode = get(schoolDetail, 'code');
  const studentProfiles = [];
  studentProfilesResponse.forEach((student) => {
    studentProfiles.push({
      ...student,
      user: get(student, 'user[0]'),
      parent: get(student, 'parentProfile[0].parentUser[0]'),
    });
  });
  const groupedStudentProfiles = studentProfiles.reduce((accumulator, currentValue) => {
    accumulator[get(currentValue, 'parent.email')] = accumulator[get(currentValue, 'parent.email')] || [];
    accumulator[get(currentValue, 'parent.email')].push(currentValue);
    return accumulator;
  }, {});
  if (groupedStudentProfiles && Object.keys(groupedStudentProfiles).length) {
    const updatedStudentsProfiles = [];
    for (const key in groupedStudentProfiles) {
      if (groupedStudentProfiles[key] && groupedStudentProfiles[key].length > 1) {
        const updatedStudentObj = {};
        const students = groupedStudentProfiles[key];
        for (let i = 0; i < students.length; i += 1) {
          if (i > 0) {
            const student = students[i];
            if (!get(student, 'user.email')) {
              let emailPreFix = get(student, 'parent.email', '').split('@')[0];
              if (!emailPreFix) {
                const studentNamesArray = get(student, 'user.name', '').split(' ');
                emailPreFix = studentNamesArray[0];
                if (emailPreFix.length <= 2) emailPreFix = `${emailPreFix}${get(student, 'rollNo')}`;
              }
              const newEmailPrefix = `${emailPreFix}${i}`;
              const newEmail = `${newEmailPrefix}@${schoolCode}.com`.toLowerCase();
              const email = await getUniqueEmail(newEmail, updatedStudentsProfiles, i, emailPreFix, context);
              if (email) {
                const updatedEmailPrefix = email.split('@')[0];
                const userInput = {
                  email,
                  password: updatedEmailPrefix,
                  savedPassword: updatedEmailPrefix,
                };
                const updatedUserId = await updateMenteeUser(get(student, 'user.id'), userInput, context);
                if (updatedUserId) {
                  log(`User Successfully updated with email: ${email} and password: ${userInput.password}`);
                  updatedStudentObj['Student Name'] = get(student, 'user.name');
                  updatedStudentObj.Grade = get(student, 'grade');
                  updatedStudentObj.Section = get(student, 'section');
                  updatedStudentObj['Roll No.'] = get(student, 'rollNo');
                  updatedStudentObj['Parent Name'] = get(student, 'parent.name');
                  updatedStudentObj['Parent Email'] = get(student, 'parent.email');
                  updatedStudentObj['Old Email'] = get(student, 'parent.email');
                  updatedStudentObj['New Email'] = email;
                  updatedStudentsProfiles.push({ ...updatedStudentObj });
                } else log(`Something went wrong for student: ${get(student, 'user.name')} with old email:${get(student, 'parent.email')} `);
              }
            }
          }
        }
      }
    }
    console.log('Updated Students', JSON.stringify(updatedStudentsProfiles));
  }
  return {
    result: true,
  };
};

export default updateSchoolStudentEmail;
