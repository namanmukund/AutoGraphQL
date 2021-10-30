import typeformWebhookController from './typeformWebhookController';

const routes = (app) => {
  // route to receive the typeform webhook data
  app.route('/typeform-webhook').post(typeformWebhookController);
};

export default routes;
