const UserBankDetail = `
  type userBankDetail @model {
    user: User! @relation(name: "UserBankDetail", direction: "OneWay")
    panNumber: String
    bankName: String
    accountName: String
    accountNumber: String
    ifscCode: String
    accountType: BankAccountType  @defaultValue(value: "saving")
  }
`;

export default UserBankDetail;
