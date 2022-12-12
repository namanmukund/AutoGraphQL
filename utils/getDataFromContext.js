import { get } from 'lodash';

const getDataFromContext = (context, key) => get(context, key, '');

export default getDataFromContext;
