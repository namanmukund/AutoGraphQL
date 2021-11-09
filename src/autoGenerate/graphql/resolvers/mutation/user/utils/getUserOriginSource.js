import { userSourceOrigin } from '../../../../../../../constants';

const getUserOriginSource = (utmSource, schoolName = '', schoolId = '') => {
  const {
    website, facebook, google, instagram, school, transformation, radioStreet,
  } = userSourceOrigin;
  let source = website;
  if (utmSource && utmSource.toLowerCase().includes('transformation')) {
    source = transformation;
  }
  if (utmSource && utmSource.toLowerCase().includes('facebook')) {
    source = facebook;
  }
  if (utmSource && utmSource.toLowerCase().includes('instagram')) {
    source = instagram;
  }
  if (utmSource && utmSource.toLowerCase().includes('google')) {
    source = google;
  }
  if (schoolId) {
    source = school;
  }
  if (schoolName && utmSource && utmSource.toLowerCase().includes('radiostreet')) {
    source = radioStreet;
  }
  return source;
};

export default getUserOriginSource;
