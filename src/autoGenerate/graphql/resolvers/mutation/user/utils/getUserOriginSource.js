import { userSourceOrigin } from '../../../../../../../constants';

const getUserOriginSource = (utmSource, schoolName = '', schoolId = '', isTmsApp = false, bookingAgentConnectId = '') => {
  const {
    website, facebook, google, instagram, school, transformation, radioStreet, agent,
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
  if (isTmsApp || bookingAgentConnectId) {
    source = agent;
  }
  return source;
};

export default getUserOriginSource;
