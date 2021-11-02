import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const courseInfoQuery = (courseId) => `
  query{
    course(id:"${courseId}"){
      id
      order
      title
    }
  }
`;

const getCourseInfo = async (courseId) => {
  const topicInfo = await callLocalGraphqlApi(courseInfoQuery(courseId));
  return topicInfo;
};

export default getCourseInfo;
