const TotalAmountCollectedInput = `
  input TotalAmountCollectedInput {
    fromDate: Date
    toDate: Date
    mentorName: String
    studentName: String
    oneToOne: Boolean
    oneToTwo: Boolean
    oneToThree: Boolean
    installmentType: InstallmentType
    installmentNumber: Int
    isSchool: Boolean @defaultValue(value: "false")
  }`;

export default [TotalAmountCollectedInput];
