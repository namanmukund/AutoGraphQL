import payUController from './payUController';

module.exports = (app) => {
  // route check if user exists and if course is bought
  app.route('/users')
    .get(payUController.users);
};
