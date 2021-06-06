import { createLeadSquared } from './actions';
// TODO: ADD CONDITION RUNNING
const birdWatch = [
  {
    on: ['signupOrLoginViaOtp', 'parentChildSignup', 'updateParentChildDetail'],
    do: [
      {
        action: createLeadSquared,
        fields: {
          mentee: {
            phoneNumber: 'Phone',
            parentName: 'parentName',
            schoolName: 'mx_School_name',
            Vertical: 'mx_Vertical',
            section: 'mx_Section',
            parentEmail: 'country',
            country: 'mx_Country_Name',
            timezone: 'mx_Timezone',
            utmSource: 'mx_utm_source',
            utmCampaign: 'mx_utm_Campaign',
            utmTerm: 'mx_utm_term',
            utmContent: 'mx_utm_content',
            utmMedium: 'mx_utm_medium',
          },
        },
      },
    ],
  },
];

export default birdWatch;
