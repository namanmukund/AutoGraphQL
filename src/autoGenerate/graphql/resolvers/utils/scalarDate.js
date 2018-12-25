import { Kind } from 'graphql/language';
import checkDateValidity from './checkDateValidity';

const scalarDate = {
  description: `The accepted format for the date is
  UTC format yyyy-MM-dd'T'HH:mm:ss'Z', for an example 2017-10-12T06:42:10.435Z `,
  __parseValue(value) {
    return value;
  },
  __serialize(value) {
    return value;
  },
  __parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return checkDateValidity(ast.value);
    }
    return null;
  },
};

export default scalarDate;
