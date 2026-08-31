import firebaseWebConfig from '../../config/firebase/firebaseWebConfig';
import serviceAccount from '../../config/firebase/serviceAccount';
import { firebaseExcludedApps } from '../../constants';

let admin = null;
try {
  // eslint-disable-next-line global-require
  admin = require('firebase-admin');
  const application = process.env.APPLICATION || 'core';
  if (!firebaseExcludedApps.includes(application) && serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseWebConfig.databaseURL,
    });
  }
} catch (e) {
  admin = {
    messaging: () => ({ send: async () => {} }),
    auth: () => ({ verifyIdToken: async () => {} }),
  };
}

export default admin;
