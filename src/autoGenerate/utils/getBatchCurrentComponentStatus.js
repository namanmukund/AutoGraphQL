import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get current batch component status
const batchCurrentComponentStatusQuery = (
  userId,
) => `
  query{
    user(id: "${userId}"){
      studentProfile{
        school{
          enrollmentType
        }
        batch{
          id
          type
          currentComponent{
            currentCourse{
              id
              order
            }
            currentTopic{
              id
              order
            }
            latestSessionStatus
            enrollmentType
          }
        }
      }
    }
  }
  `;

// query to get current batch component status
const getBatchCurrentComponentStatus = (
  userId,
) => callLocalGraphqlApi(batchCurrentComponentStatusQuery(
  userId,
));

export default getBatchCurrentComponentStatus;
