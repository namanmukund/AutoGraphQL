// maps the connect mutation Ids arrays to field names
import { connectMutationsArgumentsSuffix } from '../../../../../../constants';

const getConnectInputFieldsMap = (args) => {
  const connectMap = {};
  Object.keys(args)
    .forEach((arg) => {
      // if not a connect mutation argument, return
      // connectMutationsArgumentsSuffix = 'Ids';
      if (arg.endsWith(connectMutationsArgumentsSuffix.singular) ||
        arg.endsWith(connectMutationsArgumentsSuffix.plural)) {
        //  get fieldName from arg key
        const fieldName = arg.split(connectMutationsArgumentsSuffix.singular)[0];
        connectMap[fieldName] = args[arg];
      }
    });
  return connectMap;
};
export { getConnectInputFieldsMap };
