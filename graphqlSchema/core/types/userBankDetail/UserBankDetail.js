const UserBankDetail = `
  type UserBankDetail @model {
    user: User! @relation(name: "UserBankDetailUser")
    panNumber: String
    bankName: String
    accountName: String
    accountNumber: String
    ifscCode: String
    documentFile: File @relation(name: "UserBankDetailDocumentFile", direction: "OneWay")
    accountType: BankAccountType  @defaultValue(value: "saving")
  }
`;

export default UserBankDetail;
