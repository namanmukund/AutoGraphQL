import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';
import { CMS_HEAD, NOT_CMS_HEAD } from '../../../../constants/roles';

const Banner = `
  type Banner @model
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
    title: String
    description: String
    status: ContentStatus! @defaultValue(value: "unpublished")
    backgroundImage: File! @relation(name: "BackgroundImageBanner", direction: "OneWay")
    discountImage: File! @relation(name: "DiscountImageBanner", direction: "OneWay")
    textBeforeDiscount: String! @trim
    textBeforeDiscountFont: Int
    textBeforeDiscountColor: String
    textAfterDiscount: String! @trim
    textAfterDiscountFont: Int
    textAfterDiscountColor: String
    width: Int
    height: Int
    lottieFile: File @relation(name: "LottieFileBanner", direction: "OneWay")
    country: Country @defaultValue(value: "india")
    expiryDate: Date!
    disclaimerText: String
    type: BannerType @defaultValue(value: "marketing")
  }
`;

export default Banner;
