const CommsVariable = `
  type CommsVariable @model 
  {
    whatsappVariableName: String
    emailVariableName: String
    dataField: CommsDataField
    createdBy: User @relation(name: "CommsVariableUser", direction: "OneWay")
    events: [Event] @relation(name: "CommsVariableEvent")
  }
`;

export default [CommsVariable];
