import { TBA, TMS } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const SessionCourseReport = `
  type SessionCourseReport @model 
  ${getPermissionSchemaString('SessionReport')}
  @appPermissions(
    permissions: [
    { appName: "${TBA}" operations: "*" },
    { appName: "${TMS}" operations: "*" }
  ],
    rule: allow
  )
  {
    registered: Int
    booked: Int
    demoCompleted: Int
    converted: Int
    phoneVerified: Int
    bookedBySelf: Int
    bookedByAgent: Int
    course: Course @relation(name: "SessionCourseReportCourse", direction: "OneWay")
    country: Country @defaultValue(value: "india")
    date: Date
    vertical: Vertical
  }
`;

export default [SessionCourseReport];
