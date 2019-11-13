import { log } from '../../utils';
import admin from '../firebase';

const sendMessageToTopic = (topic, payload) => admin.messaging()
  .sendToTopic(topic, payload)
  .then((response) => {
    if (response && response.errors) {
      log(`Some issue in sending message to topic:${topic}`);
      log('Error response:', JSON.stringify(response));
      return false;
    }
    log('Successfully sent message to topic:', topic);
    return true;
  })
  .catch((error) => {
    log('Failed to send message to topic:', error);
    return false;
  });

export default sendMessageToTopic;
