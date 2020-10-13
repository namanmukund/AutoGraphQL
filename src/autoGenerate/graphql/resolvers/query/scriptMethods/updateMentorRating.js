import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const getMentorUserDetails = async (mentorId) => {
  let filter;
  if (mentorId) {
    filter = `filter:{id: "${mentorId}"}`;
  } else {
    filter = 'filter:{role:mentor}';
  }
  const query = `
    query{
      users(${filter}){
        id
      }
    }
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.users');
};

const getMentorRating = async (mentorId) => {
  const query = `
query{
  mentorMenteeSessions(filter:{
    mentorSession_some:{user_some:{id:"${mentorId}"}}
  }){
    id
    rating
  }
}
`;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorMenteeSessions', []);
};
const addMentorProfile = async (userConnectId, input) => {
  const query = `
mutation($input: MentorProfileInput!){
  addMentorProfile(
    userConnectId:"${userConnectId}"
    input: $input
  ){
    id
  }
}
`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.addMentorProfile.id');
};

const updateMentorProfile = async (id, input) => {
  const query = `
mutation($input:MentorProfileUpdate){
  updateMentorProfile(id:"${id}",
  input:$input){
    id
  }
}
`;
  const variables = {
    input,
  };
  const res = await callLocalGraphqlApi(query, '', variables);
  return get(res, 'data.updateMentorProfile.id');
};

const getMentorProfileId = async (mentorUserId) => {
  const query = `
  query{
  mentorProfiles(filter:{
    user_some:{id:"${mentorUserId}"}
  }){
    id
    user{
      id
    }
  }
}
  `;
  const res = await callLocalGraphqlApi(query);
  return get(res, 'data.mentorProfiles[0]');
};

const updateMentorRating = async (mentorId = '') => {
  const mentors = await getMentorUserDetails(mentorId);
  // eslint-disable-next-line no-restricted-syntax
  for (const mentor of mentors) {
    const { id: mentorUserId } = mentor;
    // eslint-disable-next-line no-await-in-loop
    const data = await getMentorRating(mentorUserId);
    let pythonCourseRating1 = 0;
    let pythonCourseRating2 = 0;
    let pythonCourseRating3 = 0;
    let pythonCourseRating4 = 0;
    let pythonCourseRating5 = 0;
    if (data && data.length) {
      data.forEach((obj) => {
        const { rating } = obj;
        switch (rating) {
          case 1: {
            pythonCourseRating1 += 1;
            break;
          }
          case 2: {
            pythonCourseRating2 += 1;
            break;
          }
          case 3: {
            pythonCourseRating3 += 1;
            break;
          }
          case 4: {
            pythonCourseRating4 += 1;
            break;
          }
          case 5: {
            pythonCourseRating5 += 1;
            break;
          }

          default:
        }
      });
      const updateObj = {};
      if (pythonCourseRating1) {
        updateObj.pythonCourseRating1 = pythonCourseRating1;
      }
      if (pythonCourseRating2) {
        updateObj.pythonCourseRating2 = pythonCourseRating2;
      }
      if (pythonCourseRating3) {
        updateObj.pythonCourseRating3 = pythonCourseRating3;
      }
      if (pythonCourseRating4) {
        updateObj.pythonCourseRating4 = pythonCourseRating4;
      }
      if (pythonCourseRating5) {
        updateObj.pythonCourseRating5 = pythonCourseRating5;
      }
      if (Object.keys(updateObj) && Object.keys(updateObj).length) {
        // eslint-disable-next-line no-await-in-loop
        const mentorProfile = await getMentorProfileId(mentorUserId);
        if (mentorProfile && mentorProfile.id) {
          // update
          // eslint-disable-next-line no-use-before-define,no-await-in-loop
          const updateMentorProfileData = await updateMentorProfile(mentorProfile.id, updateObj);
          // eslint-disable-next-line no-console
          console.log('updated Mentor profile:', updateMentorProfileData);
        } else {
          // add
          // eslint-disable-next-line no-await-in-loop
          const addMentorProfileData = await addMentorProfile(mentorUserId, updateObj);
          // eslint-disable-next-line no-console
          console.log('added Mentor profile:', addMentorProfileData);
        }
      }
    }
  }
};

export default updateMentorRating;
