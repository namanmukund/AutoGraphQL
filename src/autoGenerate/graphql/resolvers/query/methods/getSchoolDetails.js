import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';
import validateAuthentication from '../../../../../../utils/validateAuthentication';
import { DatabaseRecordNotFoundError } from '../../../../../../constants/errors';

const getSchoolData = (code, batchId = '') => `
{
  school(code:"${code}"){
    id
    name
    code
    coordinatorEmail
    coordinatorPhone {
      countryCode
      number
    }
    coordinatorRole
    coordinatorName
    city
    country
    isTeachersAppEnabled
    schoolPicture {
      id
    }
    logo{
      id
    }
  }
  ${batchId ? `batches(filter: { and: [{ id: "${batchId}" }, { school_some: { code: "${code}" } }] }) {
    id
  }` : ''}
}
`;

// this API will return basic school details
const getSchoolDetails = (async (root, params, context) => {
  validateAuthentication(context, 'app');
  context.currentUser = true;
  // getting input from params
  const { input: { code, batchId } } = params;
  // this will be sent in output
  const result = {};

  const getSchoolRes = await callLocalGraphqlApi(getSchoolData(code, batchId));
  const schoolId = get(getSchoolRes, 'data.school.id', '');
  const schoolLogoId = get(getSchoolRes, 'data.school.logo.id', '');
  const schoolPictureId = get(getSchoolRes, 'data.school.schoolPicture.id', '');
  const batchData = get(getSchoolRes, 'data.batches', []);
  // by default taking value as 1 in worst case
  if (!schoolId) {
    throw new DatabaseRecordNotFoundError();
  }

  if (batchId && !batchData.length) {
    throw new DatabaseRecordNotFoundError();
  }

  result.id = schoolId;
  result.name = get(getSchoolRes, 'data.school.name', '');
  result.code = get(getSchoolRes, 'data.school.code', '');
  result.coordinatorEmail = get(getSchoolRes, 'data.school.coordinatorEmail', '');
  result.coordinatorPhone = get(getSchoolRes, 'data.school.coordinatorPhone', null);
  result.coordinatorRole = get(getSchoolRes, 'data.school.coordinatorRole', '');
  result.coordinatorName = get(getSchoolRes, 'data.school.coordinatorName', '');
  result.city = get(getSchoolRes, 'data.school.city', '');
  result.isTeachersAppEnabled = get(getSchoolRes, 'data.school.isTeachersAppEnabled', false);
  result.country = get(getSchoolRes, 'data.school.country', '');
  if (schoolLogoId) {
    result.logo = { type: 'File', typeId: `${schoolLogoId}` };
  }
  if (schoolPictureId) {
    result.bgImage = { type: 'File', typeId: `${schoolPictureId}` };
  }
  result.batchId = batchId ? get(batchData, '[0].id') : '';

  return result;
});

export default getSchoolDetails;
