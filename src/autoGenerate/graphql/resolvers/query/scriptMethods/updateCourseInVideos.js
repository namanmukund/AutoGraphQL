import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchVideos = async () => {
  const query = `
          {
            videos(filter:{ topics_some: { courses_some: { id: "cjs8skrd200041huzz78kncz5" }} }) {
              id
            }
          }
          `;
  const videos = await callLocalGraphqlApi(query);
  return get(videos, 'data.videos', []);
};

const updateCourseInVideo = async (videoId) => {
  const mutation = `
      mutation{
        updateVideo(id: "${videoId}", coursesConnectIds: "cjs8skrd200041huzz78kncz5"){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.updateVideo', {});
};

const updateCourseInVideos = async () => {
  // eslint-disable-next-line no-await-in-loop
  const videos = await fetchVideos();
  // eslint-disable-next-line no-restricted-syntax
  for (const video of videos) {
    const videoId = video.id;
    if (videoId) {
      // eslint-disable-next-line no-await-in-loop
      await updateCourseInVideo(videoId);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated video id : ${videoId}`);
    }
  }
};
export default updateCourseInVideos;
