import { ADD, PLURAL, READ } from '../../../../constants/graphqlOperations';
import { TLA, TMS, TWA } from '../../../../constants';

const NetPromoterScore = `
  type NetPromoterScore @model
  @appPermissions(
    permissions:[
      { appName: "${TMS}" operations: ${READ} },
      { appName: "${TLA}" operations: [${ADD}, ${PLURAL}] },
      { appName: "${TWA}" operations: [${ADD}, ${PLURAL}] }
      ], 
    rule: allow
  ) 
  {
    score: Int! @length(min: 0, max: 10) @groupBy
    user: User! @relation(name: "NetPromoterScoreUser", direction: "OneWay")
    country: Country @defaultValue(value: "india")
  }
`;

export default NetPromoterScore;
