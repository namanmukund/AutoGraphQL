import { get } from 'lodash';
import { VideoWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';
import { getVideos } from './addVideoValidation';

const fetchCourseForVideo = async (loId) => {
  const query = `{
  video(id: "${loId}") {
    courses {
      id
    }
  }
}
`;
  const videoData = await callLocalGraphqlApi(query);
  return get(videoData, 'data.video');
};

const updateVideoValidation = async (params) => {
  const { input = {}, id: loId } = params;
  const title = get(input, 'title');
  if (title) {
    const videoData = await fetchCourseForVideo(loId);
    const courses = get(videoData, 'courses', []);
    let courseIds = '';
    courses.forEach((course) => { courseIds += `"${get(course, 'id')}"`; });
    const videoDataArray = await getVideos(courseIds, title, `{ id_not: "${loId}" }`);
    if (videoDataArray && videoDataArray.length > 0) {
      throw new VideoWithSimilarTitleAlreadyExist();
    }
  }
  return true;
};

export default updateVideoValidation;
