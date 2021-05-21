import { userSourceOrigin } from '../../../../../../../constants';

const getUserOriginSource = (utmSource, schoolName = '', schoolId = '') => {
  const {
    website, facebook, google, instagram, school, transformation,
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
  if (schoolName || schoolId) {
    source = school;
  }
  return source;
};

export default getUserOriginSource;
