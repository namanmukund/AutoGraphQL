const WhatsAppCommsVariable = `
  type WhatsAppCommsVariable @model 
  {
    variableName: String
    dataField: CommsDataField
    createdBy: User @relation(name: "WhatsAppCommsVariableUser", direction: "OneWay")
    events: [Event] @relation(name: "WhatsAppCommsVariableEvent")
  }
`;

export default [WhatsAppCommsVariable];
