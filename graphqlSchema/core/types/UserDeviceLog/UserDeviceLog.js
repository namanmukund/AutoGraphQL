const UserDeviceLog = `
  type UserDeviceLog @model {
    browser: String
    browserVersion: String
    deviceType: String
    deviceOs: String
    osVersion: String
    user: User! @relation(name:"UserDeviceLogUser") 
  }
`;

export default UserDeviceLog;
