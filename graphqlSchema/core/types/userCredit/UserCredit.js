const UserCredit = `
  type UserCredit @model 
   {  
    user: User @relation(name: "UserCreditUser", direction: "OneWay")
    credits: Int
  }
`;

export default UserCredit;
