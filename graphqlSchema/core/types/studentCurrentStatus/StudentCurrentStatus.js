const StudentCurrentStatus = `
  type StudentCurrentStatus 
  {
    status: StudentCurrentStatusType @defaultValue(value: "unRegistered")
  } 
`;

export default [StudentCurrentStatus];
