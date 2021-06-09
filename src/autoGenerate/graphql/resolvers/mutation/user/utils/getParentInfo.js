import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../../api/callLocalGraphqlApi';
import { UserAlreadyExistsError } from '../../../../../../../constants/errors';
import { createUserTokenTypeData } from '../../utils/createUserTokenTypeData';

const getParentInfo = async (context, email, phone) => {
  const result = {};
  const childrenName = [];
  const childrenToken = [];
  let filter = '';
  if (!get(phone, 'countryCode') || !get(phone, 'number')) {
    filter = `
      {email:"${email}"}
    `;
  } else {
    const { countryCode, number } = phone;
    filter = `{
      or:[
      {email:"${email}"}
      {and:[
        {phone_countryCode_subDoc:"${countryCode}"}
        {phone_number_subDoc: "${number}"}
      ]}
      ]
    }`;
  }
  const query = `
  query {
    users(filter: ${filter}){
      id
      name
      email
      phone {
      countryCode
      number
      }
      parentProfile {
        id
        children {
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
  // when same users are added with email and number separately
  if (res && res.length) {
    if (res.length > 1) {
      throw new UserAlreadyExistsError();
    }
    // if res has length 1 then check if phone and email belongs to the same user
    const {
      id, parentProfile, email: parentEmail,
    } = res[0];
    result.parentId = id;
    result.parentEmail = parentEmail;
    // changed to: either if phone or email exists and kid name is different then map the kid with the parent
    // only continue if parent phone and email are same to add a sibling
    // if (
    //   parentPhone.countryCode !== countryCode
    //         || parentPhone.number !== number
    //         || parentEmail !== email
    // ) {
    //   throw new EmailOrPhoneMismatchError();
    // }

    if (parentProfile && parentProfile.id) {
      result.parentProfileId = parentProfile.id;
      const { children } = parentProfile;
      if (children && children.length) {
        children.forEach((child) => {
          const { user: { name } } = child;
          childrenName.push(name);
          childrenToken.push(createUserTokenTypeData(child.user));
        });
      }
    }
  }
  result.childrenName = childrenName;
  result.childrenToken = childrenToken;
  return result;
};

export default getParentInfo;
