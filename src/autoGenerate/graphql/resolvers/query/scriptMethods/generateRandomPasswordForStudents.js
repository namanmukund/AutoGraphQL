/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import { callLocalGraphqlApi } from '../../../../../api';

const generateRandomPassword = (generatedPasswordList = []) => {
  let password = '';
  const possibleDigits = '123456789';

  for (let i = 0; i < 6; i += 1) {
    const randomIndex = Math.floor(Math.random() * possibleDigits.length);
    password += possibleDigits[randomIndex];
  }
  if (!generatedPasswordList.includes(password)) return password;
  return generateRandomPassword(generatedPasswordList);
};

const generateRandomPasswordForStudents = async (context) => {
  const usersRes = await callLocalGraphqlApi(`{
  users(
    filter: {
      and: [
        { role: parent }
        {
          parentProfile_some: {
            children_some: {
              school_some: {
                id_in: [
                  "clesgv1a30bxg0uhm8ycf2yoz"
                  "clesgtyk60bxf0uhm4bw9a8mk"
                  "cles4btyh07mk0uhm4w5g4aiz"
                ]
              }
            }
          }
        }
      ]
    }
  ) {
    id
    savedPassword
    email
  }
}
`, context);
  const users = get(usersRes, 'data.users', []);
  //   console.log({ users: users.length });
  const generatedPasswordList = [];
  for (const user of users) {
    const email = get(user, 'email');
    const savedPassword = get(user, 'savedPassword');
    const userId = get(user, 'id');
    const password = generateRandomPassword();
    if (password && email && savedPassword && userId) {
      generatedPasswordList.push({ userId, password });
    }
  }
  for (const user of generatedPasswordList) {
    const { userId, password } = user;
    const updateUserRes = await callLocalGraphqlApi(`mutation{
        updateUser(id:"${userId}", input:{password:"${password}", savedPassword:"${password}"}){
            id
            savedPassword
        }
        }`, context);
    // console.log(updateUserRes);
  }
//   console.log({ users: users.length, generatedPasswordList: generatedPasswordList.length });
};

export default generateRandomPasswordForStudents;
