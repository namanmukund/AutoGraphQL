import { ADD, READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const NetPromoterScore = `
  type NetPromoterScore @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TLA}" operations: [${ADD}] },
      { appName: "${TWA}" operations: [${ADD}] }
      ], 
    rule: allow
  ) 
  {
    score: Int!
    user: User! @relation(name: "NetPromoterScoreUser", direction: "OneWay")
  }
`;

export default NetPromoterScore;
