import { READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const QuestionBankImage = `
  type QuestionBankImage @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: "*" },
      { appName: "${TLA}" operations: ${READ} },
      { appName: "${TWA}" operations: ${READ} }
      ], 
    rule: allow
  )
  {
   image: File @relation(name: "QuestionBankImageFile", direction: "OneWay")
  }
`;

export default QuestionBankImage;
