import firebaseWebConfig from '../../config/firebase/firebaseWebConfig';
import serviceAccount from '../../config/firebase/serviceAccount';
import { firebaseExcludedApps } from '../../constants';

const admin = require('firebase-admin');

const application = process.env.APPLICATION || 'core';
if (!firebaseExcludedApps.includes(application)) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseWebConfig.databaseURL,
  });
}

export default admin;
