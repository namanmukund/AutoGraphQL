import { TBA, TLA, TMS } from '../../../../constants';

const CheatSheetTopicType = `
  type CheatSheetTopicType {
   topic: Topic @relation(name: "CheatSheetDataTopic", direction: "OneWay")
   isSelected: Boolean
 }`;

const CheatSheetConceptType = `
  type CheatSheetConceptType {
   cheatsheet: CheatSheet @relation(name: "CheatSheetDataConcept", direction: "OneWay")
   isBookmarked: Boolean @defaultValue(value: "false")
   isSelected: Boolean
 }`;

const CheatSheetData = `
  type CheatSheetData 
  @appPermissions(
    permissions:[
      { appName: "${TBA}" operations: "*" },
      { appName: "${TLA}" operations: "*" },
      { appName: "${TMS}" operations: "*" },
      ], 
    rule: allow
  )
  {
    cheatSheetTopics: [CheatSheetTopicType]
    cheatSheetConcepts: [CheatSheetConceptType]
  } 
`;

export default [CheatSheetData, CheatSheetTopicType, CheatSheetConceptType];
