import { createError } from 'apollo-errors';

const createAndThrowApolloError = (res) => {
  const receivedError = res.errors[0];
  const NewError = createError(receivedError.name, {
    message: receivedError.message,
  });
  throw new NewError({ data: receivedError.data });
};

export default createAndThrowApolloError;
