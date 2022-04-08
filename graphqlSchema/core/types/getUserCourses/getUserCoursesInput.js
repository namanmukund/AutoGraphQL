const GetUserCoursesInput = `
  input GetUserCoursesInput {
    userId: String
    courseProgress: Boolean @default(value: "false")
  }`;

export default [GetUserCoursesInput];
