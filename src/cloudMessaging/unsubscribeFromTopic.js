import { log } from '../../utils';
import admin from '../firebase';

const unsubscribeFromTopic = (fcmToken, topic) => admin.messaging()
  .unsubscribeFromTopic(fcmToken, topic)
  .then((response) => {
    if (response && response.errors && response.errors.length !== 0) {
      log(`Some issue in unsubscribing to topic:${fcmToken}`);
      log('Error response:', JSON.stringify(response));
      return false;
    }
    log('Successfully unsubscribed to topic:', fcmToken);
    return true;
  });
export default unsubscribeFromTopic;
