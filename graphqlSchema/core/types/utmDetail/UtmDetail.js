import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const UtmDetail = `
  type UtmDetail @model 
  ${getPermissionSchemaString('User')}
  {
    leadPartnerType: LeadPartnerType
    leadPartnerAgent: LeadPartnerAgent @relation(name: "LeadPartnerAgentUtmDetail")
    source: String
    campaign: String
    term: String
    content: String
    medium: String
  }
`;

export default [UtmDetail];
