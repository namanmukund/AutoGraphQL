import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import { createUserTokenTypeData } from '../../utils/createUserTokenTypeData';
import { MENTOR } from '../../../../../../../constants/roles';

const getChildrenToken = async (context, userId, role) => {
  const query = `
    query{
      users(filter:{
      id:"${userId}"
      }){
        id
        role
        mentorProfile {
          id
          studentProfile {
            id 
            user {
              id 
              name
              role
            }
          }
        }
      parentProfile{
          id
          children{
            id 
            user{
              id
              name
              role
            }
          }
        }
      }
    }
  `;
  const res = get(await callLocalGraphqlApi(query, context), 'data.users', []);
  // if user not found
  if (!res.length) {
    return null;
  }

  const childrenToken = [];
  if (role === MENTOR) {
    const {
      mentorProfile,
    } = res[0];

    if (!mentorProfile || !mentorProfile.id) {
      return null;
    }

    const { studentProfile } = mentorProfile;
    if (!studentProfile || !studentProfile.id) {
      return null;
    }

    const { user } = studentProfile;
    childrenToken.push(createUserTokenTypeData(user));
  } else {
    const {
      parentProfile,
    } = res[0];
    // children mapping will  not exist if parent profile does not exist
    if (!parentProfile || !parentProfile.id) {
      return null;
    }
    const { children } = parentProfile;
    if (children && children.length) {
      children.forEach((child) => {
        const { user } = child;
        childrenToken.push(createUserTokenTypeData(user));
      });
    }
  }
  return childrenToken;
};

export default getChildrenToken;
