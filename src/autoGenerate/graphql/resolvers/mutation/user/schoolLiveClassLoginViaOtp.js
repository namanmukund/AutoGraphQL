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
    $match: {
      otp,
    },
  },
  {
    $lookup: {
      from: 'BatchSession',
      let: {
        batchSessionId: '$batchSession.typeId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$id', '$$batchSessionId'],
            },
          },
        },
        {
          $lookup: {
            from: 'Batch',
            localField: 'batch.typeId',
            foreignField: 'id',
            as: 'batch',
          },
        },
        {
          $project: {
            batch: {
              id: 1,
            },
          },
        },
      ],
      as: 'batchSession',
    },
  },
  {
    $project: {
      id: 1,
      otp: 1,
      grade: 1,
      section: 1,
      batchSession: {
        $arrayElemAt: ['$batchSession', 0],
      },
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
    'SchoolSessionOtp',
  );
  const otpExist = await batchSessionModel.aggregate(
    getBatchSessionAggregation({
      otp,
    }),
  );
  // if !studentdetails return false
  if (!get(otpExist, '[0].otp')) {
    throw new OTPMismatchError();
  }
  const grade = get(otpExist, '[0].grade');
  const section = get(otpExist, '[0].section');
  const batchId = get(otpExist, '[0].batchSession.batch[0].id');
  const modelQueries = new QueryController('StudentProfile', authentication);
  const studentProfile = await fetchUserForGradeSectionAndRollNum({
    grade, section, rollNo, 'batch.typeId': batchId,
  }, modelQueries);
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
