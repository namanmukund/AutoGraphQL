import { get, capitalize } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const salesOperationQuery = (salesOperationId) => `{
  salesOperation(id: "${salesOperationId}") {
    id
    extrovertStudent
    fastLearner
    studentEnglishSpeakingSkill
    parentEnglishSpeakingSkill
    pricingPitched
    parentCounsellingDone
    courseInterestedIn
    otherReasonsComment
    leadStatus
    nextSteps
    oneToOne
    oneToTwo
    oneToThree
    knowCoding
    lookingForAdvanceCourse
    ageNotAppropriate
    notRelevantDifferentStream
    noPayingPower
    notInterestedInCoding
    notAQualifiedLeadComment
    learningAptitudeIssue
  }
}`;

export const leadStatusNextStepOptions = [
  { value: 'findReferralPartner', label: 'Need to find partner for referral' },
  { value: 'needFamilyDiscussion', label: 'Need to discuss with family' },
  { value: 'checkChildInterest', label: "Need to check child's interest" },
  { value: 'tryOtherDemoSessions', label: 'Need to try other demo sessions' },
  { value: 'didNotRespond', label: "Didn't respond will follow up" },
  { value: 'otherReasons', label: 'Other reason' },
];

const updateSalesOperationLeadSquared = async (salesOperationId, userInfo) => {
  const salesOperation = await callLocalGraphqlApi(salesOperationQuery(salesOperationId));
  const data = get(salesOperation, 'data.salesOperation');
  const phoneNumber = get(userInfo, 'data.user.studentProfile.parents[0].user.phone.number');
  const reasons = [
    {
      tag: get(data, 'knowCoding'),
      text: 'Already Knows Programming Basics',
    },
    {
      tag: get(data, 'lookingForAdvanceCourse'),
      text: 'Was Looking For Advance Course',
    },
    {
      tag: get(data, 'ageNotAppropriate'),
      text: 'Age Not Appropriate',
    },
    {
      tag: get(data, 'notRelevantDifferentStream'),
      text: 'Not Relevant',
    },
    {
      tag: get(data, 'noPayingPower'),
      text: 'No Paying Power',
    },
    {
      tag: get(data, 'notInterestedInCoding'),
      text: 'Not Interested In Coding(Just For Sake)',
    },
    {
      tag: get(data, 'learningAptitudeIssue'),
      text: 'Severe Aptitude Issues(Struggling To Learn, Unfit)',
    },
  ];
  const englishSpeakingSkill = {
    fluent: 'Fluent',
    veryFluent: 'Very Fluent',
    notFluent: 'Not Fluent',
  };
  const leadSquaredInput = {
    Phone: phoneNumber,
    mx_Unqualified_Lead_Reasons: reasons.filter((reason) => reason.tag).map((reason) => reason.text).join(' , '),
    mx_Unqualfied_Lead_Comment: get(data, 'notAQualifiedLeadComment'),
    mx_Student_Extrovert: capitalize(get(data, 'extrovertStudent')),
    mx_Student_fast_learner: capitalize(get(data, 'fastLearner')),
    mx_Student_English_Skills: englishSpeakingSkill[get(data, 'studentEnglishSpeakingSkill')],
    mx_Parent_English_Skills: englishSpeakingSkill[get(data, 'parentEnglishSpeakingSkill')],
    mx_Pricing_Pitched: get(data, 'pricingPitched') ? 'Yes' : 'No',
    mx_Parent_Counselling_Done: get(data, 'parentCounsellingDone') ? 'Yes' : 'No',
    mx_Interested_Course_Model: get(data, 'courseInterestedIn'),
    mx_mentor_session_comment: get(data, 'otherReasonsComment'),
    mx_Potential_Interested_Lead: get(data, 'leadStatus') === 'hot' ? 'Yes' : 'No',
  };
  if (get(data, 'leadStatus')) {
    if (get(data, 'leadStatus') === 'unfit') {
      leadSquaredInput.mx_Unqualified_Lead = 'Yes';
    } else {
      leadSquaredInput.mx_Unqualified_Lead = 'No';
    }
    // leadSquaredInput.mx_Lead_Conversion_Status = capitalize(get(data, 'leadStatus'));
  }
  if (get(data, 'nextSteps')) {
    leadSquaredInput.mx_Lead_Conversion_Reason = get(
      leadStatusNextStepOptions
        .find((option) => option.value === get(data, 'nextSteps')),
      'label',
      '',
    );
  }
  const activityInput = {
    ActivityEvent: 106,
  };
  const fields = [];
  // if (get(data, 'leadStatus') && get(data, 'leadStatus') !== 'Pipeline') {
  //   fields.push({
  //     SchemaName: 'mx_Custom_3',
  //     Value: capitalize(get(data, 'leadStatus')),
  //   });
  // }
  if (get(data, 'nextSteps')) {
    fields.push({
      SchemaName: 'mx_Custom_2',
      Value: get(
        leadStatusNextStepOptions
          .find((option) => option.value === get(data, 'nextSteps')),
        'label',
        '',
      ),
    });
  }
  updateLeadsquared(leadSquaredInput, false, {
    ...activityInput,
    Fields: fields,
  });
};

export default updateSalesOperationLeadSquared;
