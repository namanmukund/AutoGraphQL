const WhatsAppVariable = `
  type WhatsAppVariable @model 
  {
    createdOn: Date
    variableName: String
    dataField: WatiDataField
    createdBy: User! @relation(name: "WhatsAppVariableUser", direction: "OneWay")
  }
`;

export default [WhatsAppVariable];
