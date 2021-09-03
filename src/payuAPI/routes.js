import payUController from './payUController';

module.exports = (app) => {
  // route checks if user exists and if course is bought
  app.route('/payU/users')
    .get(payUController.users);

  // route checks if amount corresponding to product is valid
  app.route('/payU/productAmount')
    .get(payUController.productAmount);
};
