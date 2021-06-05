import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';
import { CREATED } from '../../../../constants/subscriptionEvents';

const ComicsImages = `
  type ComicsImages {
   image: File @relation(name: "ComicStripImages", direction: "OneWay")
   order: Int
 }`;

const ComicStrip = `
  type ComicStrip @model
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
      { userRole: ${NOT_CMS_HEAD} appName: "*" operations: ${READ} },
      { userRole: ${SCHOOL_ADMIN} appName: "*" operations: ${READ} }
      ], 
    rule: allow
  ) 
  @subscribe(events: [${CREATED}])
  {
    title: String @uniqueOrEmpty @trim
    description: String @uniqueOrEmpty @trim
    comicsImages: [ComicsImages]
    topics: [Topic] @relation(name: "TopicComicStrip")
    status: ContentStatus! @defaultValue(value: "unpublished")
  }
`;

export default [ComicStrip, ComicsImages];
