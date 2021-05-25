import { get } from 'lodash';
import { ProductIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchCourses = async (courseId) => {
  const query = `
          {
            courses(filter:{
              and:[
                {id: "${courseId}"},
                {
                  or:[
                      {status:published},
                      {chapters_some:{status:published}},
                      {chapters_some:{topics_some: {status:published}}},
                      {chapters_some:{topics_some:{learningObjectives_some:{status: published}}}}
                    ]
                }
              ]}){
              id
              chapters{
                id
                topics{
                  id
                  learningObjectives{
                    id
                  }
                }
              }
            }
          }
          `;
  const course = await callLocalGraphqlApi(query);
  return get(course, 'data.courses', []);
};

const deleteCourseValidation = async (params) => {
  const { id: courseId } = params;

  // the query checks if any of the lower elements (chapter, course, topic, LO) of the heirarchy are published
  const courses = await fetchCourses(courseId);
  if (courses && courses.length > 0) {
    throw new ProductIsPublishedError();
  }
  return true;
};

export default deleteCourseValidation;
