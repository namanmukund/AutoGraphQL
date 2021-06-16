import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD, SCHOOL_ADMIN } from '../../../../constants/roles';

const ComicImage = `
  type ComicImage @model
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
  {
   image: File @relation(name: "ComicImageFile", direction: "OneWay")
   order: Int
   comicStrip: ComicStrip @relation(name: "ComicStripeComicImage")
  }
`;

export default ComicImage;
