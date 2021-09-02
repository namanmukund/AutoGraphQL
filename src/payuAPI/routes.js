import payUController from './payUController';

module.exports = (app) => {
  // route checks if user exists and if course is bought
  app.route('/users')
    .get(payUController.users);

  // route checks if amount corresponding to product is valid
  app.route('/productAmount')
    .get(payUController.productAmount);
};
