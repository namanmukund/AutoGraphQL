import { get } from 'lodash';
import { CoursePackageIsPublishedError } from '../../../../../constants/errors/db';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const fetchCoursePackageStatus = async (id) => {
  const query = `
          {
            coursePackage(id : "${id}"){
              id
              status
            }
          }
          `;
  const coursePackage = await callLocalGraphqlApi(query);
  return get(coursePackage, 'data.coursePackage.status', null);
};

const deleteCoursePackageValidation = async (params) => {
  const { id } = params;

  // the query checks if any of the lower elements (chapter, course, topic, LO) of the heirarchy are published
  const status = await fetchCoursePackageStatus(id);
  if (status && status === 'published') {
    throw new CoursePackageIsPublishedError();
  }
  return true;
};

export default deleteCoursePackageValidation;
