/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable quote-props */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import uploadContacts from '../../../../../../services/email/mailmodo/uploadContacts';

const getUsers = async (skip) => {
  const usersQuery = `
      {
        users(filter:{
          and:[
            {studentProfile_some: 
              {parents_exists: true}
            }
          ]
        }, first: 1000, skip:${1000 * skip}, orderBy: createdAt_DESC){
          id
          name
          utmSource
          utmCampaign
          utmContent
          utmTerm
          utmMedium
          country
          createdAt
          studentProfile{
            parents{
              user{
                email
                phone{
                  number
                  countryCode
                }
                id
                name
              }
            }
          }
        }
      }
      `;
  const result = await callLocalGraphqlApi(usersQuery);
  return get(result, 'data.users', []);
};

const uploadUsersToMailModo = async () => {
  let userCount = 0;
  let skip = 0;
  const usersArray = [];
  try {
    do {
      const users = await getUsers(skip);
      console.log('usersLength', users.length);
      userCount = users.length;
      for (const user in users) {
        usersArray.push({
          email: get(user, 'studentProfile.parents[0].user.email', ''),
          data: {
            'Student Name': get(user, 'name', ''),
            'UTM Source': get(user, 'utmSource', ''),
            'UTM Campaign': get(user, 'utmCampaign', ''),
            'UTM Term': get(user, 'utmTerm', ''),
            'UTM Medium': get(user, 'utmMedium', ''),
            'UTM Content': get(user, 'utmContent', ''),
            'Student Grade': get(user, 'studentProfile.grade'),
            'Parent Name': get(user, 'studentProfile.parents[0].name'),
            'Lead Created On': get(user, 'createdAt'),
            'Status': 'Booked',
            'Contact': `${get(user, 'studentProfile.parents[0].phone.countryCode')}-${get(user, 'studentProfile.parents[0].phone.number')}`,
          },
          listName: 'Users',
        });
        skip += 1;
      }
    } while (userCount === 1000);
  } catch (err) {
    console.log(err);
  }
  await uploadContacts(usersArray);
};
export default uploadUsersToMailModo;
