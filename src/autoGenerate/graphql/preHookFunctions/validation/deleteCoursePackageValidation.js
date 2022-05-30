import { get } from 'lodash';
import { CoursePackageIsLinkedError, CoursePackageIsPublishedError } from '../../../../../constants/errors/db';
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
  return get(coursePackage, 'data.coursePackage', null);
};

const fetchBatchesLinkedToCoursePackageMeta = async (coursePackageId) => {
  const query = `
          {
            batchesMeta(filter: {
              coursePackage_some: {
                id: "${coursePackageId}"
              }
            }){
              count
            }
          }
          `;
  const batchesRes = await callLocalGraphqlApi(query);
  return get(batchesRes, 'data.batchesMeta.count', 0);
};

const deleteCoursePackageValidation = async (params) => {
  const { id } = params;

  // the query checks if any of the lower elements (chapter, course, topic, LO) of the heirarchy are published
  const coursePackage = await fetchCoursePackageStatus(id);
  const batchesMeta = await fetchBatchesLinkedToCoursePackageMeta(id);
  if (get(coursePackage, 'status') && get(coursePackage, 'status') === 'published') {
    throw new CoursePackageIsPublishedError();
  }
  if (batchesMeta) {
    throw new CoursePackageIsLinkedError();
  }
  return true;
};

export default deleteCoursePackageValidation;
