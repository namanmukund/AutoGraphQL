/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import { QueryController } from '../../../controllers';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getAllUsers = [
  {
    $match: {
      'id': {
        $exists: true,
      },
      'name': {
        $exists: true,
      }
    },
  },
  {
    $project: {
      _id: 0,
    },
  },
];

const fetchSchoolStudents = async (schoolId) => {
  const query = `
  {
    users(filter:{
      studentProfile_some:{
        school_some:{
          id: "${schoolId}"
        }
      }
    }) {
      id
      role
      name
      studentProfile {
        rollNo
        grade
        section
        school {
          code
        }
        parents {
          id
          user {
            id
            name
            email
            username
            phone {
              number
            }
            password
          }
        }
      }
    }
  }
  `;
  const schoolStudents = await callLocalGraphqlApi(query);
  return get(schoolStudents, 'data.users');
};

const updateUser = async (id, input) => {
  const updateQuery = `mutation($input:UserUpdate!){
    updateUser(id: "${id}" input: $input) {
      id
    }
  }
`;
  const updatedResult = await callLocalGraphqlApi(updateQuery, '', { input });
  return get(updatedResult, 'data.updateUser')
};

const updateUserNameEmailPassword = async () => {
  const newAuthentication = {
    bypass: true,
  };
  const allUsers = new QueryController('User', newAuthentication);
  const getAllUsersData = await allUsers.aggregate(getAllUsers);

  // set school id, code and weather to update emails or not
  const schoolId = "ckhnniyu700050vtn1o6x9016"
  const schoolCode = 'eureka'
  const updateEmail = false
  const schoolStudents = await fetchSchoolStudents(schoolId);
  const nameMap = {}

  for (const student of schoolStudents) {
    const firstName = get(student, 'studentProfile.parents[0].user.name').split(' ')[0]
    if (firstName) {
      const findname = getAllUsersData.filter(item => get(item, 'name').toLowerCase() === firstName.toLowerCase())
      let finalname
      if (findname.length > 0) {
        if (findname.length === 1) {
          finalname = firstName
        } else {
          if (nameMap[firstName]) {
            nameMap[firstName] += 1
            finalname = firstName + nameMap[firstName]
          } else {
            nameMap[firstName] = 1
            finalname = firstName +1
          }
        }
      }
      let finalmail = ''
      let input = {
        'username': finalname,
        'password': finalname,
      }
      if (updateEmail) {
        let firstEmail = get(student, 'studentProfile.parents[0].user.email').split('@')[0]
        if (firstEmail) {
          const firstEmailChars = firstEmail.split('')
          let finalLastNumber = ''
          for (let i = firstEmailChars.length - 1; i>=0; i--) {
            if (!isNaN(firstEmailChars[i])) {
              finalLastNumber = firstEmailChars[i] + finalLastNumber
            }
          }
          finalmail = `${schoolCode}${finalLastNumber}@tekie.in`
          input['email'] = finalmail
        }
      }
      if (finalname) {
        const id = get(student, 'studentProfile.parents[0].user.id')
        await updateUser(id, input)
      }
    }
  }
};

export default updateUserNameEmailPassword;