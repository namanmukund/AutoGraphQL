import { get } from 'lodash';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const addUserLeadSquared = (params, create = true) => {
  if (get(params, 'input.Vertical') === 'b2b') {
    return;
  }
  if (get(params, 'input.schoolName') && !get(params, 'input.Vertical') && !get(params, 'input.fromEventsPage')) {
    return;
  }

  const leadSquaredInput = {
    Phone: create
      ? `${get(params, 'input.phone.countryCode')}-${get(params, 'input.phone.number')}`
      : get(params, 'input.phone.number'),
  };

  if (get(params, 'input.grade')) {
    leadSquaredInput.mx_Student_Grade = get(params, 'input.grade').replace('Grade', '');
  }
  if (get(params, 'input.parentName')) {
    leadSquaredInput.FirstName = get(params, 'input.parentName');
  }
  if (get(params, 'input.childName')) {
    leadSquaredInput.mx_Student_Name = get(params, 'input.childName');
  }
  if (get(params, 'input.mx_Demo_Model')) {
    leadSquaredInput.mx_Demo_Model = get(params, 'input.mx_Demo_Model');
  }

  if (get(params, 'input.schoolName')) {
    leadSquaredInput.mx_School_name = get(params, 'input.schoolName');
  }
  if (get(params, 'input.status')) {
    leadSquaredInput.mx_Lead_Status = get(params, 'input.status');
  }

  if (get(params, 'input.Vertical')) {
    leadSquaredInput.mx_Vertical = get(params, 'input.Vertical');
  } else if (!get(params, 'input.schoolName')) {
    leadSquaredInput.mx_Vertical = 'b2c';
  } else {
    leadSquaredInput.mx_Vertical = 'b2c';
  }

  if (get(params, 'input.section')) {
    leadSquaredInput.mx_Section = get(params, 'input.section');
  }
  leadSquaredInput.Source = 'WEBSITE';
  if (get(params, 'input.parentEmail')) {
    leadSquaredInput.EmailAddress = get(params, 'input.parentEmail');
  }
  if (get(params, 'input.country')) {
    leadSquaredInput.mx_Country_Name = get(params, 'input.country');
  }
  if (get(params, 'input.city')) {
    leadSquaredInput.mx_City = get(params, 'input.city');
  }

  if (get(params, 'input.unVerifiedLead')) {
    leadSquaredInput.mx_OTP_Verified = 'No';
  }

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
  if (get(params, 'input.campaignCode')) {
    leadSquaredInput.mx_school_booking_code = get(params, 'input.campaignCode');
    leadSquaredInput.mx_school_booking_link = `https://www.tekie.in/login?code=${leadSquaredInput.mx_school_booking_code}`;
  }

  updateLeadsquared(leadSquaredInput, create);
};

export default addUserLeadSquared;
