const UserLocationLog = `
  type UserLocationLog @model { 
    ip: String
    city: String
    region: String
    regionCode: String
    country: String
    countryName: String
    countryCode: String
    latitude: String
    longitude: String
    postal: String
    timezone: String
    utcOffset: String
    countryCallingCode: String
    currency: String
    user: User @relation(name:"UserLocationLogUser")    
  }
`;

export default UserLocationLog;
