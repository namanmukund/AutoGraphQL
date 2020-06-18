import { ConnectIdRequiredError } from '../../../../../constants/errors';

const addSalesOperationValidation = async (params) => {
  const { clientConnectId, monitoredByConnectId } = params;
  if (!clientConnectId && !monitoredByConnectId) {
    throw new ConnectIdRequiredError();
  }
};

export default addSalesOperationValidation;
