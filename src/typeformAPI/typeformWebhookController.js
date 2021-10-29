import { get } from 'lodash';
import { log } from '../../utils';
import getHashDigest from './typeform-utils/getHashDigest';

const typeformWebhookController = async (req, res) => {
  const digest = getHashDigest(get(req, 'headers'));
  log(`digest ${digest}`);
  res.send('thanks');
};

export default typeformWebhookController;
