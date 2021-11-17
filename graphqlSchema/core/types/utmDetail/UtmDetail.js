import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UtmDetail = `
  type UtmDetail @model 
  ${getPermissionSchemaString('User')}
  {
    leadPartnerType: LeadPartnerType!
    utmSource: String
    campaign: String
    term: String
    content: String
    medium: String
  }
`;

export default [UtmDetail];
