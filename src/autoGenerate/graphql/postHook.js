import hook from './hook';
import birdwatch from '../../birdwatch';
import { log } from '../../../utils';

const posthook = async (input, mutationName, context, params) => {
  try {
    await birdwatch(input, mutationName, context, params);
  } catch (err) {
    log(`Birdwatch posthook error for "${mutationName}": ${err.message}`, 'error');
  }
  return hook(input, mutationName, 'PostHook');
};

export { posthook };
