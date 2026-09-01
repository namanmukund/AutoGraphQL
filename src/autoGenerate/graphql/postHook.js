import hook from './hook';
import birdwatch from '../../birdwatch';

const posthook = async (input, mutationName, context, params) => {
  try {
    await birdwatch(input, mutationName, context, params);
  } catch (err) {
    // Log non-blocking hook error
  }
  return hook(input, mutationName, 'PostHook');
};

export { posthook };
