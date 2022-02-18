import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { SINGULAR } from '../../../../../../constants/graphqlOperations';
import getChildrenToken from './utils/getChildrenToken';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import {
  OTPMismatchError, UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { QueryController } from '../../../controllers';
import { getUserFromDBQuery } from './utils';
import { RollNumberMismatchMessageError } from '../../../../../../constants/errors/auth';

const USER_TYPE = 'User';

const fetchUserForGradeSectionAndRollNum = (input, modelQueries) => modelQueries.fetchOne(input);

// const getStudentClassDetails = async (otp) => {
//   const query = `
//   query{
//     batchSessions(filter:{and:[
//       {
//         schoolSessionsOtp_some:{
//           otp:${otp}
//         }
//       }
//     ]}){
//         schoolSessionsOtp{
//           grade
//           section
//         }
//       }
//     }`;
//   const result = await callLocalGraphqlApi(query);
//   const studentDetails = get(
//     result,
//     'data.batchSessions[0].schoolSessionsOtp[0]',
//     null,
//   );
//   return studentDetails;
// };

const getTypeQueryController = (
  typeName,
  authentication = {
    bypass: true,
  },
) => new QueryController(typeName, authentication);

const getBatchSessionAggregation = ({
  otp,
}) => [
  {
    $lookup: {
      from: 'SchoolSessionOtp',
      localField: 'schoolSessionsOtp.typeId',
      foreignField: 'id',
      as: 'schoolSessionOtp',
    },
  },
  {
    $project: {
      schoolSessionOtp: {
        id: 1,
        otp: 1,
        grade: 1,
        section: 1,
      },
    },
  },
  {
    $match: {
      'schoolSessionOtp.otp': otp,
    },
  },
];
// const getStudentDetails = async (section, grade, rollNo) => {
//   const query = `
//   query{
//     users(filter:{
//       and:[
//         {studentProfile_some:{
//           and: [
//             {grade:${grade}},
//             {section:${section}},
//             {rollNo:"${rollNo}"}
//           ]
//         }}
//       ]
//     }){
//       id
//       role
//       name
//       studentProfile{
//         id
//       }
//     }
//   }
//   `;
//   const result = await callLocalGraphqlApi(query);
//   const studentDetails = get(result, 'data.users[0]', null);
//   return studentDetails;
// };

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
  const batchSessionModel = getTypeQueryController(
    'BatchSession',
  );
  const otpExist = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      otp,
    }),
  );
  // if !studentdetails return false
  if (!get(otpExist, '[0].schoolSessionOtp', []).length) {
    throw new OTPMismatchError();
  }
  const sessionOtpObj = get(otpExist, '[0].schoolSessionOtp', []).find((sessionOtp) => get(sessionOtp, 'otp') === otp);
  if (!sessionOtpObj) {
    throw new OTPMismatchError();
  }
  const { section, grade } = sessionOtpObj;
  const modelQueries = new QueryController('StudentProfile', authentication);
  const studentProfile = await fetchUserForGradeSectionAndRollNum({ grade, section, rollNo }, modelQueries);
  if (!studentProfile) {
    throw new RollNumberMismatchMessageError();
  }
  const userModalQuery = new QueryController(USER_TYPE, authentication);

  const userData = await getUserFromDBQuery({ id: get(studentProfile, 'user.typeId') }, userModalQuery);
  const userTokenData = createUserTokenTypeData(userData, authentication);
  // if user is a parent then get children tokens as well
  if (get(userData, 'role') === 'parent') {
    userTokenData.children = await getChildrenToken(context, studentId);
  }
  return userTokenData;
};
export default signupOrLoginViaOtp;
