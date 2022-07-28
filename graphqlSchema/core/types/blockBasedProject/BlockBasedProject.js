import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import getPermissionSchemaString from '../../../../src/autoGenerate/utils/getPermissionSchemaString';

const BlockBasedProject = `
  type BlockBasedProject @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  ) 
  ${getPermissionSchemaString('BlockBasedProject')}
  {
    title: String! @trim
    order: Int
    projectDescription: String @trim
    difficulty: Int
    projectCreationDescription: String @trim
    projectThumbnail: File @relation(name: "BlockBasedProjectThumbnail", direction: "OneWay")
    externalPlatformLogo: File @relation(name: "BlockBasedProjectExternalPlatformLogo", direction: "OneWay")
    externalPlatformLink: String
    layout: BlockBasedProjectLayout! @defaultValue(value: "externalPlatform")
    initialBlocks: String
    answerDescription: String @trim
    answerThumbnail: File @relation(name: "BlockBasedProjectAnswerThumbnail", direction: "OneWay")
    topics: [Topic] @relation(name: "TopicBlockBasedProject")
    status: ContentStatus! @defaultValue(value: "unpublished")
    isSubmitAnswer: Boolean
    isHomework: Boolean @defaultValue(value: "false")
    type: BlockBasedProjectType!
    courses: [Course] @relation(name: "CourseBlockBasedProject", direction: "OneWay")
    tags: [ContentTag] @relation(name: "BlockBasedProjectTag")
    externalDescriptionEnabled: Boolean @defaultValue(value: "false")
    embedViewHeight: Int @defaultValue(value: "100")
    answerFormat: BlockBasedPracticeAnswerType @defaultValue(value: "answerLink")
    answerFormatDescription: String @trim
  }
`;

export default BlockBasedProject;
