/* eslint-disable no-unused-vars */
import { get } from 'lodash';
import {
  ChildAlreadyRegisteredError,
  DatabaseRecordNotFoundError,
  SomethingWentWrongError,
} from '../../../../../../constants/errors';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import addParentProfile from './utils/addParentProfile';
import updateUser from './utils/updateUser';
import { MENTEE } from '../../../../../../constants/roles';
import generateInviteCode from '../../../../../../utils/generateInviteCode';
import { generateCuid, log } from '../../../../../../utils';
import checkForValidReferralCode from './utils/checkForValidReferralCode';
import studentProfileAvatarCodes from '../../../../../../constants/studentProfileAvatarCodes';
import addUserData from './utils/addUserData';
import addStudentProfile from './utils/addStudentProfile';
import { MissingMandatoryInputInRequestError } from '../../../../../../constants/errors/input';
import addToUserInviteList from './utils/addToUserInviteList';
import getSchoolInformation from './utils/getSchoolInformation';
import validateUpdateParentChildDetailInput from './utils/validateUpdateParentChildDetailInput';
import addUserCredit from './utils/addUserCredit';
import { REGISTRATION_BASE_CREDIT } from '../../../../../../constants';
import { SIGN_UP_BONUS } from '../../../../../../constants/userCreditReason';
import { QueryController } from '../../../controllers';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import getBatchIdByBatchCreationBasis from './utils/getBatchIdByBatchCreationBasis';
import parentChildSignupPostHookMethod from '../../../postHookFunctions/parentChildSignupPostHookMethod';
import sendTransactionalEmail from '../../utils/sendTransactionalEmail';

const getParentChildExistingDetails = async (userId) => {
  const query = `
      query{
        user(id:"${userId}"){
          id
          phone {
            number
            countryCode
          }
          campaign{
            school {
              name
            }
            id
            type
            batchRules{
              batchCreationBasis
            }
            batches{
              id
              type
              classes{
                grade
                section
              }
            }
          }
          source
          vertical
          utmSource
          utmCampaign
          utmTerm
          utmContent
          utmMedium
          parentProfile{
            id
            children{
              id
              user{
                id
                name
              }
            }
          }
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.user');
};

const getChildrenDataOfAParent = async (parentProfileId) => {
  const query = `
      query{
        parentProfile(id: "${parentProfileId}") {
          id
          children {
            id
            user {
              id
              name
              role
            }
          }
        }
      }
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.parentProfile');
};

const updateParentChildDetailMutationResolver = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  validateAuthentication(context);
  const { input } = params;

  validateUpdateParentChildDetailInput(input);

  const {
    parentName,
    childName,
    parentEmail,
    parentPhone,
    grade,
    section,
    hasLaptopOrDesktop,
    referralCode,
    schoolName,
    country,
    timezone = 'Asia/Kolkata',
  } = input;

  // validate mandatory params
  if (!childName || !grade) {
    throw new MissingMandatoryInputInRequestError();
  }

  const { userId, schoolId } = params;
  const existingUserDetails = await getParentChildExistingDetails(userId);
  const existingUserId = get(existingUserDetails, 'id');
  const campaign = get(existingUserDetails, 'campaign');
  const campaignType = get(campaign, 'type');

  if (!existingUserId) {
    throw new DatabaseRecordNotFoundError();
  }

  /*
      update parent user details if provided in the input
  */
  let vertical = '';
  if (parentName || parentEmail || (parentPhone && parentPhone.number)) {
    const userInputData = {};
    if (parentName) {
      userInputData.name = parentName.trim();
    }
    if (parentEmail) {
      userInputData.email = parentEmail.trim();
    }
    if (parentPhone && parentPhone.number && parentPhone.countryCode) {
      userInputData.phone = parentPhone;
    }
    if (campaignType) {
      if (campaignType === 'b2b') {
        vertical = 'b2b';
      } else {
        vertical = 'b2b2c';
      }
    } else {
      vertical = 'b2c';
    }
    userInputData.vertical = vertical;
    const variables = {
      input: userInputData,
    };
    await updateUser(existingUserId, variables);
  }

  let parentProfileId = get(existingUserDetails, 'parentProfile.id');
  /* if parentProfile does not exist then create it
--student profile does not exist too and student user does not exist too
  */
  if (!parentProfileId) {
    // add parent profile
    const parentProfileInputData = {};
    if (hasLaptopOrDesktop) {
      parentProfileInputData.hasLaptopOrDesktop = hasLaptopOrDesktop;
    }
    const variables = {
      input: parentProfileInputData,
    };
    parentProfileId = await addParentProfile(
      existingUserId,
      variables,
    );
  } else {
    // validate if the child being added is not already exist
    const children = get(existingUserDetails, 'parentProfile.children');
    if (children && children.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const child of children) {
        const { user: { name } } = child;
        if (name === childName) {
          throw new ChildAlreadyRegisteredError();
        }
      }
    }
  }

  /*
Create student and their user profile
 */
  const childData = {
    name: childName.trim(),
    role: MENTEE,
    inviteCode: generateInviteCode(8),
    signUpBonusCredited: true,
    source: existingUserDetails.source,
    country: country || 'india',
    timezone,
    vertical,
  };

  const {
    utmSource,
    utmCampaign,
    utmTerm,
    utmContent,
    utmMedium,
  } = existingUserDetails;

  if (utmSource || utmCampaign || utmTerm || utmContent || utmMedium) {
    if (utmSource) childData.utmSource = utmSource;
    if (utmCampaign) childData.utmCampaign = utmCampaign;
    if (utmTerm) childData.utmTerm = utmTerm;
    if (utmContent) childData.utmContent = utmContent;
    if (utmMedium) childData.utmMedium = utmMedium;
  } else {
    if (get(input, 'utmSource')) childData.utmSource = get(input, 'utmSource');
    if (get(input, 'utmCampaign')) childData.utmCampaign = get(input, 'utmCampaign');
    if (get(input, 'utmTerm')) childData.utmTerm = get(input, 'utmTerm');
    if (get(input, 'utmContent')) childData.utmContent = get(input, 'utmContent');
    if (get(input, 'utmMedium')) childData.utmMedium = get(input, 'utmMedium');
  }
  // check if the child has been referred by a valid user
  const referredByUserData = await checkForValidReferralCode(referralCode);
  if (referredByUserData && referredByUserData.id) {
    childData.fromReferral = true;
    childData.giftVoucherApplied = false;
  }
  const childDataWithId = generateCuid(childData);

  // handle vertical, child same as parent
  if (existingUserDetails.vertical) {
    childData.vertical = existingUserDetails.vertical;
  }

  const childUserData = await addUserData({ bypass: true }, childDataWithId);
  const { id: childUserId } = childUserData;
  if (!childUserId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'childUserId not found',
      },
    });
  }
  /*
  Check school info
   */
  //  if  school information exist add school data;
  let studentSchoolId = schoolId;
  if (schoolName || schoolId) {
    if (!schoolId) {
      studentSchoolId = await getSchoolInformation(schoolName);
    }
  }
  const studentProfileInputData = {};
  if (grade) {
    studentProfileInputData.grade = grade;
  }
  if (section) {
    studentProfileInputData.section = section;
  }

  if (get(input, 'schoolName') && !schoolId && !studentSchoolId) {
    studentProfileInputData.schoolName = get(input, 'schoolName');
  }

  studentProfileInputData.profileAvatarCode = studentProfileAvatarCodes[Math.floor((Math.random() * studentProfileAvatarCodes.length))] || 'theo';
  const studentProfileInput = {
    input: studentProfileInputData,
  };
  /*
  If coming from campaign and the type os b2b allocate the user to the right batch
   */
  let batchId = '';
  if (campaignType && campaignType === 'b2b') {
    const batchCreationBasis = get(campaign, 'batchRules.batchCreationBasis');
    const batches = get(campaign, 'batches', []);
    if (batches && batches.length) {
      batchId = getBatchIdByBatchCreationBasis(
        batchCreationBasis,
        batches,
        grade,
        section,
      );
    }
  }

  if (get(params, 'batchId')) batchId = get(params, 'batchId');

  const studentProfileId = await addStudentProfile(
    studentProfileInput,
    childUserId,
    parentProfileId,
    studentSchoolId,
    batchId,
  );

  if (!studentProfileId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'studentProfileId not found',
      },
    });
  }

  // if referredByUserId then add to the list of invite user
  if (referredByUserData && referredByUserData.id) {
    try {
      await addToUserInviteList(referredByUserData.id, childUserId);
    } catch (e) {
      log('Error in adding to user invite', e);
    }
  }
  // add base credit to user
  await addUserCredit(REGISTRATION_BASE_CREDIT, childUserId, SIGN_UP_BONUS);
  const parentProfile = await getChildrenDataOfAParent(parentProfileId);
  const { children } = parentProfile;
  const childrenToken = [];
  if (children && children.length) {
    children.forEach((child) => {
      const { user } = child;
      childrenToken.push(createUserTokenTypeData(child.user));
    });
  }
  // return primary user
  const queryController = new QueryController('User', { bypass: true });
  const parentUserData = await queryController.fetchOne({ id: existingUserId });

  // generate parent token
  const userTokenData = createUserTokenTypeData(parentUserData, authentication, '', false);
  // generate kids token
  userTokenData.children = childrenToken;

  // leadsquared
  // update leadsquared
  const leadSquaredParams = {
    ...params,
    input: {
      ...params.input,
      fromEventsPage: get(input, 'eventId'),
      phone: {
        number: get(existingUserDetails, 'phone.number'),
        countryCode: get(existingUserDetails, 'phone.countryCode'),
      },
    },
  };
  if (get(existingUserDetails, 'campaign.school.name', '')) {
    leadSquaredParams.input.schoolName = get(existingUserDetails, 'campaign.school.name', '');
  }
  if (campaignType) {
    leadSquaredParams.input.Vertical = campaignType.replace('Event', '');
  }
  // if (!campaignType && !schoolName) {
  //   sendTransactionalEmail({
  //     parentEmail,
  //     parentName,
  //   }, {
  //     emailTemplate: 'WelcomeEmail',
  //     subject: 'Welcome to Tekie, your next steps!',
  //   });
  // }

  parentChildSignupPostHookMethod(input, leadSquaredParams, false);
  return userTokenData;
};

export default updateParentChildDetailMutationResolver;
