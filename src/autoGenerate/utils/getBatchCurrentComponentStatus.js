import callLocalGraphqlApi from '../../api/callLocalGraphqlApi';

// query to get current batch component status
const batchCurrentComponentStatusQuery = (userId) => `
  query{
    user(id: "${userId}"){
      studentProfile{
        school{
          enrollmentType
        }
        batch{
          id
          course {
            id
          }
          type
          coursePackageTopicRule{
            order
            topic{
              id
            }
          }
          coursePackage{
            id
            courses {
              id
            }
            topics{
              order
              topic{
                id
              }
            }
          }
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
        batches {
          id
          course {
            id
          }
          type
          coursePackageTopicRule{
            order
            topic{
              id
            }
          }
          coursePackage{
            id
            courses {
              id
            }
            topics{
              order
              topic{
                id
              }
            }
          }
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
  context,
) => callLocalGraphqlApi(batchCurrentComponentStatusQuery(
  userId,
), context);

export default getBatchCurrentComponentStatus;
