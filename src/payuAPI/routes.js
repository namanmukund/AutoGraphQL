import payUController from './payUController';

const routes = (app) => {
  // route checks if user exists and if course is bought
  app.route('/payU/users')
    .get(payUController.users);

  // route checks if amount corresponding to product is valid
  app.route('/payU/paymentStatus')
    .get(payUController.paymentStatus);

  // route returns amount and discount code if applicable
  app.route('/payU/fetchProduct')
    .get(payUController.fetchProduct);
};

export default routes;
