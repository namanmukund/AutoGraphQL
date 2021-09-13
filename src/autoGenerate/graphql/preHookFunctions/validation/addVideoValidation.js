import { get } from 'lodash';
import { VideoWithSimilarTitleAlreadyExist } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

export const getVideos = async (courseIds, title, videoFilter) => {
  const query = `{
  videos(
    filter: {
      and: [
        ${courseIds ? `{ courses_some:{ id_in:[${courseIds}] } }` : ''}
        ${title ? `{ title: "${title}" }` : ''}
        ${videoFilter || ''}
      ]
    }
  ) {
    id
  }
}
`;
  const videoDatas = await callLocalGraphqlApi(query);
  return get(videoDatas, 'data.videos');
};

const addVideoValidation = async (params) => {
  const { coursesConnectIds = [], input = {} } = params;
  const title = get(input, 'title');
  if (title) {
    let courseIds = '';
    coursesConnectIds.forEach((courseId) => { courseIds += `"${courseId}"`; });
    // check if the videos with similar title exist
    const videoDatas = await getVideos(courseIds, title);
    if (videoDatas && videoDatas.length > 0) {
      throw new VideoWithSimilarTitleAlreadyExist();
    }
  }
  return true;
};

export default addVideoValidation;
