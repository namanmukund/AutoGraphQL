import { trim, trimEnd } from 'lodash';

// function to get merged graphql types(mutation,queries,subscriptions) from different files
const mergeGraphqlTypeStrings = (graphqlType1, graphqlType2) => {
  const graphqlTypeString1 = trim(graphqlType1);
  const graphqlTypeString2 = trim(graphqlType2);
  const splitString1 = graphqlTypeString1.split('{');
  const splitString2 = graphqlTypeString2.split('{');
  // check if types of both are same
  if (splitString1[0] !== splitString2[0]) {
    throw new Error('Error in merging types, non-similar types passed');
  }
  const type1String = trimEnd(splitString1[1], '}');
  const type2String = trimEnd(splitString2[1], '}');
  const mergedString = `${splitString1[0]}{${type1String},${type2String}}`;
  return mergedString;
};

export default mergeGraphqlTypeStrings;
