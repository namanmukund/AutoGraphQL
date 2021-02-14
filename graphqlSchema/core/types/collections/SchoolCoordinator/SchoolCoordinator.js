const SchoolCoordinator = `
  type SchoolCoordinator {
   email: String @uniqueOrEmpty @trim
    phone: Phone @uniqueOrEmpty
    role: SchoolCoordinatorRole
    name: String
 }`;

export default SchoolCoordinator;
