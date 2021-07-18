import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import updateLeadsquared from '../../../../../services/leadsquared/updateLeadSquared';

const getPhoneNumber = async (id) => {
  const query = `
    {
      user(id: "${id}") {
        name
        studentProfile {
          parents {
            user {
              id
              phone {
                number
                countryCode
              }
            }
          }
        }
      }
    }
  `;
  const res = await callLocalGraphqlApi(query);
  const phone = get(res, 'data.user.studentProfile.parents[0].user.phone', {});
  return phone;
};

const updateUserLeadSquared = async (input) => {
  const leadSquaredInput = {};
  if (input.country) {
    leadSquaredInput.mx_Country_Name = input.country;
  }
  if (input.role === 'parent') {
    leadSquaredInput.FirstName = input.name;
    leadSquaredInput.Phone = get(input, 'phone.number');
  }
  if (input.role === 'mentee') {
    leadSquaredInput.mx_Student_Name = input.role;
    const phone = await getPhoneNumber(input.id);
    leadSquaredInput.Phone = get(phone, 'number');
  }
  if (input.email) {
    leadSquaredInput.EmailAddress = input.email;
  }
  updateLeadsquared(leadSquaredInput, false);
};

export default updateUserLeadSquared;
