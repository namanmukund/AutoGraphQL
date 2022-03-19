import iciciController from './iciciController';

const routes = (app) => {
  // route checks if user exists and if course is bought
  app.route('/icici/generateToken')
    .post(iciciController.generateToken);

  // route checks if amount corresponding to product is valid
  app.route('/icici/paymentStatus')
    .post(iciciController.paymentStatus);
};

export default routes;
