import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../../../../constants/errors';
import { createUserTokenTypeData } from '../../utils/createUserTokenTypeData';

const getChildrenToken = async (context, userId) => {
  const query = `
    query{
      users(filter:{
      id:"${userId}"
      }){
        id
        role
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
    throw new DatabaseRecordNotFoundError();
  }

  const {
    parentProfile,
  } = res[0];
  // children mapping will  not exist if parent profile does not exist
  if (!parentProfile || !parentProfile.id) {
    throw new DatabaseRecordNotFoundError();
  }

  const { children } = parentProfile;
  const childrenToken = [];
  if (children && children.length) {
    children.forEach((child) => {
      const { user } = child;
      childrenToken.push(createUserTokenTypeData(user));
    });
  }
  return childrenToken;
};

export default getChildrenToken;
