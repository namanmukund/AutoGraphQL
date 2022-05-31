import phonePeController from './phonePeController';

const routes = (app) => {
  // route checks if user exists and if course is bought
  app.route('/phonePe/fetchUsers')
    .get(phonePeController.fetchUsers);

  // route checks if amount corresponding to product is valid
  app.route('/phonePe/paymentStatus')
    .get(phonePeController.paymentStatus);

  // route checks if amount corresponding to product is valid & updates payment status
  app.route('/phonePe/verifyPaymentStatus')
    .get(phonePeController.verifyPaymentStatus);

  // route returns amount and discount code if applicable
  app.route('/phonePe/fetchProducts')
    .get(phonePeController.fetchProducts);
};

export default routes;
