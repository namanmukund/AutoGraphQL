import { get } from 'lodash';
import { getFieldsBeingFetched } from '../../../../utils';
import { validate } from '../../../validation';
import { ADD } from '../../../../../../constants/graphqlOperations';
import {
  ChildAlreadyRegisteredError,
  SomethingWentWrongError,
  UserTokenNotRequiredError,
} from '../../../../../../constants/errors';
import { MENTEE, PARENT } from '../../../../../../constants/roles';
import { generateCuid, getRandomNumber, log } from '../../../../../../utils';
import { MutationController, QueryController } from '../../../controllers';
import { createUserTokenTypeData } from '../utils/createUserTokenTypeData';
import generateInviteCode from '../../../../../../utils/generateInviteCode';
import {
  backendApps, rangeOTP, REGISTRATION_BASE_CREDIT, TMS,
} from '../../../../../../constants';
import addUserCredit from './utils/addUserCredit';
import { SIGN_UP_BONUS } from '../../../../../../constants/userCreditReason';
import getFirstTopicAndLearningObjective from '../../../../utils/getFirstTopicAndLearningObjective';
import addUserCurrentTopicComponentStatus from '../../../../utils/addUserCurrentTopicComponentStatus';
import studentProfileAvatarCodes from '../../../../../../constants/studentProfileAvatarCodes';
import addParentProfile from './utils/addParentProfile';
import checkForValidReferralCode from './utils/checkForValidReferralCode';
import addUserData from './utils/addUserData';
import addToUserInviteList from './utils/addToUserInviteList';
import addStudentProfile from './utils/addStudentProfile';
import validateParentChildSignUpInput from './utils/validateParentChildSignUpInput';
import getParentInfo from './utils/getParentInfo';
import getUserOriginSource from './utils/getUserOriginSource';
import updateSchoolDataOfAStudent from './utils/updateSchoolDataOfAStudent';
import getBatchDetailsFromACampaign from './utils/getBatchDetailsFromACampaign';
import getBatchIdByBatchCreationBasis from './utils/getBatchIdByBatchCreationBasis';
import getSchoolInformation from './utils/getSchoolInformation';
import parentChildSignupPostHookMethod from '../../../postHookFunctions/parentChildSignupPostHookMethod';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
// import sendBookingReminderOrConfirmationB2B from '../../../postHookFunctions/utils/sendBookingReminderOrConfirmationB2B2C';
import getUserPasswordObject from './utils/getUserPasswordObject';
import { getNumberAndSendSms } from '../../../../../sms';
import updateLeadSquared from '../../../../../../services/leadsquared/updateLeadSquared';

const USER_TYPE = 'User';

const FETCH_CAMPAIGN = (campaignId) => `{
  campaign(id: "${campaignId}") {
    type
    school {
      name
    }
  }
}`;

const updateExistingUserOTP = (
  searchObj,
  updateObj,
  modelMutations,
) => modelMutations.updateOne(searchObj, updateObj);

/*
- both the parent and a kid is registered
- email & phone both are required
- to add a sibling both phone and email of a parent should match
- user is returned with the kid's token as a role mentee
- two profiles are also created and mapped with each other
*/
const parentChildSignUpMutationResolver = async (
  root,
  params,
  context,
  typeName,
  info,
  mutationName,
  ast,
  authentication,
) => {
  const {
    input, schoolId, campaignId = false, bookingAgentId = false,
  } = params;
  const { fieldNodes } = info;
  const fieldsFetched = getFieldsBeingFetched(fieldNodes);

  validate(
    'UserToken',
    ast,
    ADD,
    fieldsFetched,
    authentication,
    {},
  );

  const currentUser = authentication && authentication.user;
  const isBackendApp = backendApps.includes(get(authentication, 'app.name'));
  const istmsApp = get(authentication, 'app.name') === TMS;

  if (!isBackendApp && currentUser && currentUser) {
    throw new UserTokenNotRequiredError();
  }
  validateParentChildSignUpInput(input, isBackendApp);
  const {
    parentName,
    childName,
    parentEmail,
    parentPhone,
    parentPassword,
    childPassword,
    childEmail,
    grade,
    section,
    rollNo,
    branch,
    hasLaptopOrDesktop,
    referralCode,
    isBuyNow,
    utmSource,
    utmCampaign,
    utmTerm,
    utmContent,
    utmMedium,
    schoolName,
    country = 'india',
    timezone = 'Asia/Kolkata',
  } = input;
  // check if parent exist in db
  const parentInfo = await getParentInfo(context, parentEmail, parentPhone, isBackendApp);
  let parentId;
  let parentProfileId;
  Object.assign(authentication, {
    bypass: true,
  });
  const source = getUserOriginSource(utmSource, schoolName, schoolId, istmsApp, bookingAgentId);
  /* this campaign obj will be later in this method */
  /* fetching earlier to update vertical in user */
  let campaign = null;
  if (campaignId) {
    campaign = await getBatchDetailsFromACampaign(campaignId);
  }

  // if parent exist don't add parent and check if the child exists too
  if (parentInfo && parentInfo.parentId && parentInfo.parentEmail) {
    parentId = parentInfo.parentId;
    parentProfileId = parentInfo.parentProfileId;
    const { childrenName } = parentInfo;
    if (childrenName && childrenName.length && childrenName.includes(childName)) {
      if (!isBuyNow) {
        throw new ChildAlreadyRegisteredError();
      }
      // // if the page is buy now then login the user and provide the relevant information
      // // in such case return user data with token
      const queryController = new QueryController(USER_TYPE, authentication);
      const parentUserData = await queryController.fetchOne({ id: parentId });
      // generate parent token
      const userTokenData = createUserTokenTypeData(parentUserData, authentication, '', true);
      // generate kids token
      userTokenData.children = [
        ...parentInfo.childrenToken,
      ];
      return userTokenData;
    }
  } else {
    const parentData = {
      name: parentName.trim(),
      email: parentEmail.trim().toLowerCase(),
      role: PARENT,
      utmSource,
      utmCampaign,
      utmTerm,
      utmContent,
      utmMedium,
      source,
      country,
      timezone,
    };

    if (get(parentPhone, 'countryCode') && get(parentPhone, 'number')) {
      parentData.phone = parentPhone;
    }

    // set parent password
    if ((isBackendApp || istmsApp) && parentPassword) {
      const passwordObj = getUserPasswordObject(parentPassword, true);
      Object.assign(parentData, passwordObj);
    }

    if (campaignId) {
      parentData.campaign = {
        type: 'Campaign',
        typeId: campaignId,
      };
    }

    if (source !== 'school') {
      parentData.vertical = 'b2c';
    } else {
      /* eslint-disable-next-line no-lonely-if */
      if (campaignId) {
        const campaignType = get(campaign, 'type');
        if (campaignType && campaignType === 'b2b') {
          parentData.vertical = 'b2b';
        } else {
          parentData.vertical = 'b2b2c';
        }
      }
    }

    const parentDataWithId = generateCuid(parentData);
    let parentUserData;
    /*
    handling case where parent phone exists but email does not exist
     */
    if (!get(parentInfo, 'parentId')) {
      // add if parent is not added
      parentUserData = await addUserData(authentication, parentDataWithId);
    } else {
      // case of phone and not email of a parent user data
      // eslint-disable-next-line no-unused-vars
      const { id, ...updateObj } = parentDataWithId;
      updateObj.id = get(parentInfo, 'parentId');
      parentUserData = await addUserData(authentication, updateObj, 'update');
    }

    if (!parentUserData || !parentUserData.id) {
      throw new SomethingWentWrongError({
        data: {
          message: 'parentId not found',
        },
      });
    }
    parentId = parentUserData.id;
  }

  if (!parentProfileId) {
    const parentProfileInputData = {};
    if (hasLaptopOrDesktop) {
      parentProfileInputData.hasLaptopOrDesktop = hasLaptopOrDesktop;
    }
    const variables = {
      input: parentProfileInputData,
    };
    parentProfileId = await addParentProfile(
      parentId,
      variables,
    );
  }

  const childData = {
    name: childName.trim(),
    role: MENTEE,
    inviteCode: generateInviteCode(8),
    signUpBonusCredited: true,
    source,
    utmSource,
    utmCampaign,
    utmTerm,
    utmContent,
    utmMedium,
    country,
    timezone,
  };

  if (isBackendApp && childEmail) {
    childData.email = childEmail.trim().toLowerCase();
  }
  // set child password
  if (isBackendApp && childEmail && childPassword) {
    // set email half as password
    const passwordObj = getUserPasswordObject(childPassword, true);
    Object.assign(childData, passwordObj);
  }

  // check if the child has been referred by a valid user
  const referredByUserData = await checkForValidReferralCode(referralCode);
  if (referredByUserData && referredByUserData.id) {
    childData.fromReferral = true;
    childData.giftVoucherApplied = false;
  }

  // same logic for vertical as parent
  if (source !== 'school') {
    childData.vertical = 'b2c';
  } else {
    /* eslint-disable-next-line no-lonely-if */
    if (campaignId) {
      const campaignType = get(campaign, 'type');
      if (campaignType && campaignType === 'b2b') {
        childData.vertical = 'b2b';
      } else {
        childData.vertical = 'b2b2c';
      }
    }
  }

  const childDataWithId = generateCuid(childData);

  const childUserData = await addUserData(authentication, childDataWithId);
  const { id: childUserId } = childUserData;
  if (!childUserId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'childUserId not found',
      },
    });
  }
  const studentProfileInputData = {};
  if (grade) {
    studentProfileInputData.grade = grade;
  }
  if (section) {
    studentProfileInputData.section = section;
  }
  if (rollNo) {
    studentProfileInputData.rollNo = rollNo;
  }
  if (section) {
    studentProfileInputData.branch = branch;
  }

  studentProfileInputData.profileAvatarCode = studentProfileAvatarCodes[Math.floor((Math.random() * studentProfileAvatarCodes.length))] || 'theo';
  const studentProfileInput = {
    input: studentProfileInputData,
  };
  /*
Update school info too
 */
  let studentSchoolId = schoolId;
  if (!schoolId && schoolName) {
    studentSchoolId = await getSchoolInformation(schoolName);
  }

  /*
If coming from campaign and the type os b2b allocate the user to the right batch
*/
  let batchId = '';
  if (campaign && campaign.id) {
    const campaignType = get(campaign, 'type');
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
  }
  if (get(campaign, 'school.id')) {
    studentSchoolId = get(campaign, 'school.id');
  }
  const studentProfileId = await addStudentProfile(
    studentProfileInput,
    childUserId,
    parentProfileId,
    studentSchoolId,
    batchId,
    bookingAgentId,
  );

  if (!studentProfileId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'studentProfileId not found',
      },
    });
  }
  // add parentProfile
  if (!parentProfileId) {
    throw new SomethingWentWrongError({
      data: {
        message: 'parentProfileId not found',
      },
    });
  }
  const queryController = new QueryController(USER_TYPE, authentication);
  const parentUserData = await queryController.fetchOne({ id: parentId });
  // generate parent token
  const userTokenData = createUserTokenTypeData(parentUserData, authentication, '', true);
  // generate kids token
  userTokenData.children = [
    ...parentInfo.childrenToken,
    createUserTokenTypeData(childUserData, authentication, '', true),
  ];

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
  //  if  school information exist add school data
  if (get(input, 'schoolName') || schoolId) {
    const updatedStudentProfileId = await updateSchoolDataOfAStudent(input, studentProfileId);
    if (updatedStudentProfileId) {
      // eslint-disable-next-line no-param-reassign
      params.input.isSchoolStudent = true;
    }
  }

  /*
    logic to add current user topic component status
    the first published topic and first published learning objective corresponding to that topic
    will get populated in the document
    */
  const topic = await getFirstTopicAndLearningObjective();
  const firstTopicId = get(topic, 'data.topics[0].id');
  const firstLearningObjectiveId = get(topic, 'data.topics[0].learningObjectives[0].id');
  // we are not throwing any error here because it will seem that sign up failed if
  // firstTopicId and firstLearningObjectiveId is not present. Just adding log
  if (firstTopicId && firstLearningObjectiveId) {
    await addUserCurrentTopicComponentStatus(
      childUserId, firstTopicId, firstLearningObjectiveId,
    );
  } else {
    log('Failed to get first published topic or first published learning objective corresponding to it in parentChildSignUp');
  }

  const eventSources = ['radiostreet', 'spysquadcamp', 'communityevent', 'spysquad'];

  const fromEventsPage = utmSource && eventSources.includes(utmSource.toLowerCase());

  const leadSquaredParams = params;

  if (campaignId) {
    const res = await callLocalGraphqlApi(FETCH_CAMPAIGN(campaignId));
    leadSquaredParams.input.schoolName = get(res, 'data.campaign.school.name', '');
  }
  if (schoolName) {
    leadSquaredParams.input.schoolName = schoolName;
  }
  const campaignType = get(campaign, 'type', '');
  if (campaignType) {
    leadSquaredParams.input.Vertical = campaignType.replace('Event', '');
  }

  leadSquaredParams.input.unVerifiedLead = true;

  leadSquaredParams.input.phone = get(input, 'parentPhone');
  leadSquaredParams.input.fromEventsPage = fromEventsPage;

  parentChildSignupPostHookMethod(input, leadSquaredParams);

  // Send OTP if from RadioStreet event
  if (fromEventsPage) {
    // send b2b2c reg+booking
    // sendBookingReminderOrConfirmationB2B(parentId);
    const phoneOtp = getRandomNumber(rangeOTP.min, rangeOTP.max);
    const modelMutations = new MutationController(typeName, authentication);
    const updateObj = {
      phoneOtp,
      phoneOtpCreationDate: new Date(),
    };

    setTimeout(() => {
      updateLeadSquared({
        Phone: get(parentPhone, 'number'),
        mx_Event_Date: utmSource.includes('SpySquadCamp') || utmSource.includes('communityevent') ? '26 December' : '26 December',
        mx_Event_Time: utmSource.includes('SpySquadCamp') || utmSource.includes('communityevent') ? '03:00 pm' : '11:00 am',
        mx_Event_Date_Time: utmSource.includes('SpySquadCamp') || utmSource.includes('communityevent') ? '2021-12-26 09:30:00' : '2021-12-26 05:30:00',
      }, false, {
        ActivityEvent: 208,
        Fields: [
          {
            SchemaName: 'mx_Custom_1',
            Value: utmSource,
          },
          {
            SchemaName: 'mx_Custom_2',
            Value: utmCampaign,
          },
        ],
      });
    }, 1000 * 60 * 2);

    // update phoneOtp in db
    await updateExistingUserOTP({ id: parentId }, updateObj, modelMutations);
    getNumberAndSendSms(parentPhone, phoneOtp, parentName);
  }

  return userTokenData;
};

export default parentChildSignUpMutationResolver;
