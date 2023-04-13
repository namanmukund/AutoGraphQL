import { get } from 'lodash';
import { PUBLISHED, UNPUBLISHED } from '../../../../../constants';
import { VideoIsPublishedError } from '../../../../../constants/errors';
import callLocalGraphqlApi from '../../../../api/callLocalGraphqlApi';

const deleteVideoValidation = async (params, _, context) => {
  const { id: videoId } = params;
  const query = `
        {
            video(id:"${videoId}") {
                status
                videoFile {
                  uri
                  id
                }
            }
        }
    `;
  const video = await callLocalGraphqlApi(query);
  context.deletedVideoURL = get(video, 'data.video.videoFile.uri', '');
  if (get(video, 'data.video.status', UNPUBLISHED) === PUBLISHED) {
    throw new VideoIsPublishedError();
  }
  return true;
};

export default deleteVideoValidation;
