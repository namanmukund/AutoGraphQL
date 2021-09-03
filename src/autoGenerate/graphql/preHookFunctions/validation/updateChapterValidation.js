import { ChapterWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import getChaptersForCourses from './utils/getChaptersForCourses';

const updateChapterValidation = async (input, mutationOrQueryName, context, params) => {
  const { coursesConnectIds = [], id: chapterId, input: { title } } = params;
  //   to check if the chapter exist with similar title for the selected course
  if (title && coursesConnectIds.length > 0) {
    let coursesIds = '';
    coursesConnectIds.forEach((courseId) => { coursesIds += `"${courseId}"`; });
    const chaptersData = await getChaptersForCourses(coursesIds, title, `{ id_not:"${chapterId}" }`);
    if (chaptersData && chaptersData.length > 0) {
      throw new ChapterWithSimilarTitleAlreadyExist();
    }
  }
  return true;
};

export default updateChapterValidation;
