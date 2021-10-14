import { get } from 'lodash';
import {
  GLOBAL_COURSE_TITLE,
  PUBLISHED,
} from '../../../../constants';
import callLocalGraphqlApi from '../../../api/callLocalGraphqlApi';
import { DatabaseRecordNotFoundError } from '../../../../constants/errors';

// query to get chapters and topics belomngin to a course
const getCourseQuery = () => `
    query{
      courses(filter:{
        and:[
          {title: "${GLOBAL_COURSE_TITLE}"},
          {status: ${PUBLISHED}}
        ]
      }){
        id
      }
    }
  `;

// query to get chapters and topics belomngin to a course
const getBatchQuery = (batchId) => `
    query{
      batch(id:"${batchId}"){
        id
        code
        students{
          id
          user{
            id
            source
            studentProfile{
              id
            }
          }
        }
        currentComponent{
          id
          latestSessionStatus
          currentTopic{
            id
          }
        }
      }
    }
  `;

// mutation to update adhoc sessions
const updateAdhocSessionQuery = (
  adhocSessionId, pushManyQuery,
) => `
  mutation{
    updateAdhocSession(id:"${adhocSessionId}",  input:{
      ${pushManyQuery}
    }){
      id
    }
  }
  `;

/*
  Post hook of addAdhocSession
*/
/* eslint-disable-next-line no-unused-vars */
const addAdhocSessionPostHookMethod = async (input, params, mutationName, context) => {
  const batchId = get(params, 'batchConnectId');
  const topicId = get(params, 'topicConnectId');
  let courseId = get(params, 'courseConnectId');
  const { id: batchSessionId } = input;

  /*
    get Course Id
  */
  if (!courseId) {
    const courseResult = await callLocalGraphqlApi(getCourseQuery());
    const course = get(courseResult, 'data.courses');
    if (course.length <= 0) {
      throw new DatabaseRecordNotFoundError({
        data: {
          error: 'Published course is not present with title as python from component addBatchPostHookMethod',
        },
      });
    }
    courseId = course[0].id;
  }

  /*
    get batch info
  */
  const batchResult = await callLocalGraphqlApi(getBatchQuery(batchId));
  const batchInfo = get(batchResult, 'data.batch');
  const { students } = batchInfo;

  // add students to the adhoc session and mark them absent as default
  if (students && students.length && topicId) {
    let pushManyQuery = 'attendance:{ pushMany: [';
    students.forEach((studentElem) => {
      if (studentElem.user && studentElem.user.studentProfile && studentElem.user.studentProfile.id) {
        pushManyQuery += `{studentConnectId: "${studentElem.user.studentProfile.id}", 
                                               isPresent: false, 
                                               }, `;
      }
    });
    pushManyQuery += ']}';
    // pushing new array of students in adhoc session
    await callLocalGraphqlApi(updateAdhocSessionQuery(
      batchSessionId,
      pushManyQuery,
    ));
  }
};

export default addAdhocSessionPostHookMethod;
