import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import {
  OTPMismatchError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { RollNumberMismatchMessageError } from '../../../../../../constants/errors/auth';

const USER_TYPE = 'User';

const getStudentClassDetails = async (otp) => {
  const query = `
  query{
    batchSessions(filter:{and:[
      {
        schoolSessionsOtp_some:{
          otp:${otp}
        }
      }
    ]}){
        schoolSessionsOtp{
          grade
          section
        }
      }
    }`;
  const result = await callLocalGraphqlApi(query);
  const studentDetails = get(
    result,
    'data.batchSessions[0].schoolSessionsOtp[0]',
    null,
  );
  return studentDetails;
};
const getStudentDetails = async (section, grade, rollNo) => {
  const query = `
  query{
    users(filter:{
      and:[
        {studentProfile_some:{
          and: [
            {grade:${grade}},
            {section:${section}},
            {rollNo:"${rollNo}"}
          ]
        }}
      ]
    }){
      id
      role
      name
      studentProfile{
        id
      }
    }
  }
  `;
  const result = await callLocalGraphqlApi(query);
  const studentDetails = get(result, 'data.users[0]', null);
  return studentDetails;
};

const signupOrLoginViaOtp = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate('ParentChildToken', ast, SINGULAR, fieldsFetched, authentication, {});
  const currentUser = authentication && authentication.user;

  if (currentUser) {
    throw new UserTokenNotRequiredError();
  }

  const rollNo = get(input, 'rollNo');
  const otp = get(input, 'otp');
  const studentDetails = await getStudentClassDetails(otp);
  // if !studentdetails return false
  if (!studentDetails) {
    throw new OTPMismatchError();
  }
  const grade = get(studentDetails, 'grade');
  const section = get(studentDetails, 'section');
  const studentData = await getStudentDetails(section, grade, rollNo);
  // if !studentdetails return false
  if (!studentData) {
    throw new RollNumberMismatchMessageError();
  }
  const modelQueries = new QueryController(USER_TYPE, authentication);

  const userData = await getUserFromDBQuery({ id: studentData.id }, modelQueries);
  const userTokenData = createUserTokenTypeData(userData, authentication);
  // if user is a parent then get children tokens as well
  if (studentData.role === 'parent') {
    userTokenData.children = await getChildrenToken(context, studentId);
  }
  return userTokenData;
};
export default signupOrLoginViaOtp;
