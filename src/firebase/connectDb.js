import admin from './admin';
import { log } from '../../utils';

const ref = admin.database().ref();
ref.once('value')
  .then(() => {
    log('firebase is connected');
  }).catch((err) => {
    log(err);
  });
