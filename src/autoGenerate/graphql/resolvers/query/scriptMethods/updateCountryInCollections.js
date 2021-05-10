/* eslint-disable no-console */
import MutationController from '../../../controllers/MutationController';

const collectionNames = [
  // 'User',
  // 'MenteeSession',
  // 'MentorSession',
  // 'MentorMenteeSession',
  // 'SalesOperation',
  // 'Product',
  'UserPaymentPlan',
];

const updateCountryInCollections = async () => {
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  for (const cn of collectionNames) {
    console.log('Updating...', cn);
    const mutationController = new MutationController(cn, { bypass: true });
    // eslint-disable-next-line no-await-in-loop
    const res = await mutationController.update({}, { enrollmentStatus: 'active', sessionVelocityStatus: 'onTime' }, true);
    console.log('Updated...', res);
  }
};

export default updateCountryInCollections;
