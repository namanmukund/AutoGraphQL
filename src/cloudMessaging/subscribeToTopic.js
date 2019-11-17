import { log } from '../../utils';
import admin from '../firebase';

const subscribeToTopic = (fcmToken, topic) => admin.messaging()
  .subscribeToTopic(fcmToken, topic)
  .then((response) => {
    if (response && response.errors && response.errors.length !== 0) {
      log(`Some issue in subscribing to topic:${fcmToken}`);
      log('Error response:', JSON.stringify(response));
      return false;
    }
    log('Successfully subscribed to topic:', fcmToken);
    return true;
  })
  .catch((error) => {
    log('Error subscribing to topic:', error);
    return false;
  });

export default subscribeToTopic;
