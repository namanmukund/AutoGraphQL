const WhatsAppVariable = `
  type WhatsAppVariable @model 
  {
    variableName: String
    dataField: WatiDataField
    createdBy: User! @relation(name: "WhatsAppVariableUser", direction: "OneWay")
    events: [Event] @relation(name: "WhatsAppVariableEvent")
  }
`;

export default [WhatsAppVariable];
