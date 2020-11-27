import { get } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const addUserLeadSquared = (params) => {
  const leadSquaredInput = {
    Phone: get(params, 'input.parentPhone.number'),
    mx_Student_Name: get(params, 'input.childName'),
    mx_Student_Grade: get(params, 'input.grade').replace('Grade', ''),
    FirstName: get(params, 'input.parentName'),
    Source: 'WEBSITE',
    EmailAddress: get(params, 'input.parentEmail'),
  };
  if (get(params, 'input.utmSource')) {
    leadSquaredInput.mx_utm_source = get(params, 'input.utmSource');
  }
  if (get(params, 'input.utmCampaign')) {
    leadSquaredInput.mx_utm_Campaign = get(params, 'input.utmCampaign');
  }
  if (get(params, 'input.utmTerm')) {
    leadSquaredInput.mx_utm_term = get(params, 'input.utmTerm');
  }
  if (get(params, 'input.utmContent')) {
    leadSquaredInput.mx_utm_content = get(params, 'input.utmContent');
  }
  if (get(params, 'input.utmMedium')) {
    leadSquaredInput.mx_utm_medium = get(params, 'input.utmMedium');
  }
  updateLeadsquared(leadSquaredInput, true);
};

export default addUserLeadSquared;
