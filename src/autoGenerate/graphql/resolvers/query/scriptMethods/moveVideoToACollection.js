import { get } from 'lodash';
import callLocalGraphqlApi from '../../../../../api/callLocalGraphqlApi';

const fetchTopics = async () => {
  const query = `
          {     
            topics{
              id
              order
              video{
                id
              }
              videoTitle
              videoDescription
              videoSubtitle{
                id
              }
              videoThumbnail{
                id
              }
              videoStatus
              videoStartTime
              videoEndTime
              storyStartTime
              storyEndTime
              storyThumbnail{
                id
              }
            }
          }
          `;
  const topics = await callLocalGraphqlApi(query);
  return get(topics, 'data.topics', []);
};

const addVideo = async (topicId, videoFileConnectId, subtitleConnectId, thumbnailConnectId, storyThumbnailConnectId, videoTitle, videoDesc, status, videoStartTime, videoEndTime, storyStartTime, storyEndTime) => {
  const mutation = `
      mutation{
        addVideo(
          ${videoFileConnectId ? `videoFileConnectId: "${videoFileConnectId}"` : ''}
          ${subtitleConnectId ? `subtitleConnectId: "${subtitleConnectId}"` : ''}
          ${thumbnailConnectId ? `thumbnailConnectId: "${thumbnailConnectId}"` : ''}
          ${storyThumbnailConnectId ? `storyThumbnailConnectId: "${storyThumbnailConnectId}"` : ''}
          ${topicId ? `topicsConnectIds: "${topicId}"` : ''}
          input:{
            ${videoTitle ? `title: "${videoTitle}"` : ''}
            ${videoDesc ? `description: "${videoDesc}"` : ''}
            ${status ? `status: ${status}` : ''}
            ${videoStartTime ? `videoStartTime: ${videoStartTime}` : ''}
            ${videoEndTime ? `videoEndTime: ${videoEndTime}` : ''}
            ${storyStartTime ? `storyStartTime: ${storyStartTime}` : ''}
            ${storyEndTime ? `storyEndTime: ${storyEndTime}` : ''}
          }
        ){
          id
        }
      }
      `;
  const result = await callLocalGraphqlApi(mutation);
  return get(result, 'data.addVideo', {});
};

const moveVideoToACollection = async () => {
  // eslint-disable-next-line no-await-in-loop
  const topics = await fetchTopics();
  // eslint-disable-next-line no-restricted-syntax
  for (const topic of topics) {
    const topicId = topic.id;
    if (topicId) {
      const videoFileConnectId = get(topic, 'video.id', '');
      const subtitleConnectId = get(topic, 'videoSubtitle.id', '');
      const thumbnailConnectId = get(topic, 'videoThumbnail.id', '');
      const storyThumbnailConnectId = get(topic, 'storyThumbnail.id', '');
      const videoTitle = get(topic, 'videoTitle', '');
      const videoDesc = get(topic, 'videoDescription', '');
      const status = get(topic, 'videoStatus', '');
      const videoStartTime = get(topic, 'videoStartTime', 0);
      const videoEndTime = get(topic, 'videoEndTime', 0);
      const storyStartTime = get(topic, 'storyStartTime', 0);
      const storyEndTime = get(topic, 'storyEndTime', 0);
      // eslint-disable-next-line no-await-in-loop
      await addVideo(topicId, videoFileConnectId, subtitleConnectId, thumbnailConnectId, storyThumbnailConnectId, videoTitle, videoDesc, status, videoStartTime, videoEndTime, storyStartTime, storyEndTime);
      // eslint-disable-next-line no-console
      console.log(`>>>>> Updated topic id : ${topicId}, with order : ${topic.order}`);
    }
  }
};
export default moveVideoToACollection;
