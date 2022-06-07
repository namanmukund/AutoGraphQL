const UserInputForBuddyLogin = `
input UserInputForBuddyLogin{
  userId: ID
  isPrimaryUser: Boolean
}`;

const SchoolLiveClassLoginInput = `
  input SchoolLiveClassLoginInput {
      userId: ID
      buddyLoginInput: [UserInputForBuddyLogin]
  }`;

export default [SchoolLiveClassLoginInput, UserInputForBuddyLogin];
