const addSalesOperationActivityQuery = (
  loggedByConnectId,
  salesOperationConnectId,
  actionOn,
  currentData,
  oldData = '',
) => `mutation{
  addSalesOperationActivity(input:{
    actionOn:${actionOn}
    currentData: "${currentData}"
    ${oldData ? `oldData: "${oldData}"` : ''}
  }, loggedByConnectId:"${loggedByConnectId}",salesOperationConnectId:"${salesOperationConnectId}"){
    id
  }
}`;

export default addSalesOperationActivityQuery;
