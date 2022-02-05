import { get } from "lodash";
import { getFieldsBeingFetched } from "../../../../utils";
import { validate } from "../../../validation";
import { SINGULAR } from "../../../../../../constants/graphqlOperations";
import callLocalGraphqlApi from "../../../../../api/callLocalGraphqlApi";
import getChildrenToken from "./utils/getChildrenToken";
import { createUserTokenTypeData } from "../utils/createUserTokenTypeData";
import {
  UnknownUserError,
  OTPMismatchError,
} from "../../../../../../constants/errors";

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
    "data.batchSessions[0].schoolSessionsOtp[0]",
    null
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
    }
  }
  `;
  const result = await callLocalGraphqlApi(query);
  const studentDetails = get(result, "data.users[0].id", null);
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
  authentication
) => {
  const { input } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);
  validate("BooleanResult", ast, SINGULAR, fieldsFetched, authentication, {});
  const rollNo = get(input, "rollNo");
  const otp = get(input, "otp");
  const studentDetails = await getStudentClassDetails(otp);
  // if !studentdetails return false
  if (!studentDetails) {
    throw new OTPMismatchError();
  }
  const grade = get(studentDetails, "grade");
  const section = get(studentDetails, "section");
  const studentId = await getStudentDetails(section, grade, rollNo);
  // if !studentdetails return false
  if (!studentDetails) {
    throw new Error(UnknownUserError());
  }
  const userTokenData = createUserTokenTypeData(studentId, authentication);
  // if user is a parent then get children tokens as well
  if (role === PARENT) {
    userTokenData.children = await getChildrenToken(context, studentId);
  }
  return userTokenData;
};
export default signupOrLoginViaOtp;
