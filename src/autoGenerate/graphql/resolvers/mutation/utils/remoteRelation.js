import { RemoteController } from '../../../controllers';
import { RemoteRelationError } from '../../../../../../constants/errors';
import { filterRemotePayload } from '../../../../utils';

const remoteConnectDisconnectRelationHandler = (
  args,
  typeName,
  typeField,
  relatedType,
  relatedTypeField,
  feildsFetched,
  mutationName,
  ast,
  authentication,
) => {
  // Check if typeField is remote field
  if (ast[typeName].remoteFields && ast[typeName].remoteFields[typeField]) {
    // If typeField is remote field, relatedTypeField should also be remote field
    const remoteAppName = ast[typeName].remoteFields[typeField].name;
    if (ast[relatedType].remoteFields && ast[relatedType].remoteFields[relatedTypeField]
        && (remoteAppName === ast[relatedType].remoteFields[relatedTypeField].name)) {
      // Filtering out only the fields that are application to remote.
      const payload = filterRemotePayload(
        typeName,
        typeField,
        relatedType,
        relatedTypeField,
        remoteAppName,
        ast,
        feildsFetched,
      );
      // If both typeField and relationFields are remote fields,
      // then call remote controller and return.
      const appModelRemote = new RemoteController(remoteAppName, authentication);
      // @TODO, this will not work if the fetched fields have local as well as remote fields,
      // as for that to work, the results are to be parsed and local fields
      // needs to be fetched and merged.
      return appModelRemote.relationMutation(mutationName, args, payload)
        .then((appResultRemote) => {
          const appData = appResultRemote.data;
          const appErrors = appResultRemote.errors;
          if (appErrors) {
            throw new Error(JSON.stringify(appErrors));
          }
          return appData[mutationName];
        });
    }
    // Throw an error
    throw new RemoteRelationError();
  }
  return null;
};

export default remoteConnectDisconnectRelationHandler;
