import jwt from 'jsonwebtoken';
import MasterController from './MasterController';
import allAuthParams from '../../../../config/authParams';
import { FRONTEND_APP_ONE, SUPER_ADMIN } from '../../../../constants';

const application = process.env.APPLICATION || 'core';
const authParams = allAuthParams[application];
class TokenController extends MasterController {
  generateTokenForSuperAdmin() {
    this.validate();
    const expiresIn = authParams.SUPER_ADMIN_TOKEN_EXPIRY_DATE;
    const algorithm = authParams.ALGORITHM;
    const token = jwt.sign(
      {
        appInfo: {
          name: FRONTEND_APP_ONE,
          role: SUPER_ADMIN,
        },
      },
      authParams.SECRET,
      {
        expiresIn,
        algorithm,
      },

    );
    return token;
  }
}

export default TokenController;
