import { READ } from '../../../../constants/graphqlOperations';
import { TMS, TLA, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const NewsFeed = `
  type NewsFeed @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ],
    rule: allow
  )
  @userPermissions(
  permissions:[
    { userRole: ${CMS_HEAD} appName: "*" operations: "*" },
    { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} }
    ],
  rule: allow
  )
  {
    title: String! @trim
    description: String @trim
    publishedBy: Publisher
    publishedOn: Date
    newsFeedLink: String @trim
    thumbnail: File @relation(name: "NewsFeedThumbnail", direction: "OneWay")
    thumbnailSmall: File @relation(name: "NewsFeedThumbnailSmall", direction: "OneWay")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default NewsFeed;