import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';


const getUsersWithNoSignUpBonus = async () => {
  const query = `
      query{
        users(filter:{
          and:[
            {role:mentee}
            {
              or:[
                {signUpBonusCredited:false}
                {signUpBonusCredited_exists:false}
              ]
            }
            
          ]
        }){
          id
          name
          signUpBonusCredited
          signUpBonusNotified
          createdAt
          studentProfile{
            id
            parents{
              id
              user{
                id
                name
                phone{
                  countryCode
                  number
                }
              }
            }
          }
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.users');
};

export default getUsersWithNoSignUpBonus;
